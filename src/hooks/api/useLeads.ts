import { applyLeadUpdateResponse, getLeadUpdateScope } from '@/utils/leadUpdateCache';
import { scheduleSalesKpiRefresh } from '@/utils/salesKpiRefresh';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  ApiResponse,
  BulkCreateResponse,
  BulkUploadResponse,
  Lead,
  LeadCommentFormat,
  LeadCommentLevel,
  LeadExportPreview,
  LeadExportRequest,
  LeadFilters,
  LeadsListResponse,
  LeadTimelineEvent,
  PaginatedResponse,
  ValidationResult,
} from '@/types';

const leadApi = {
  getLeads: (params: LeadFilters) =>
    api.get<PaginatedResponse<Lead>>('/leads', { params }),
  getLead: (id: string) => api.get<{ data: Lead }>(`/leads/${id}`),
  createLead: (data: Partial<Lead>) => api.post('/leads', data),
  updateLead: ({ id, data }: { id: string; data: Partial<Lead> }) =>
    api.put<ApiResponse<Lead>>(`/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/leads/${id}`),
  bulkCreateLeads: (data: { leads: Partial<Lead>[]; updateDuplicates?: boolean }) =>
    api.post<ApiResponse<BulkCreateResponse>>('/leads/bulk', data),
  bulkUpload: (formData: FormData) =>
    api.post<ApiResponse<BulkUploadResponse>>('/leads/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  validateLeads: (data: { leads: Partial<Lead>[] }) =>
    api.post<{ data: ValidationResult }>('/leads/validate', data),
  qualifyLead: ({ id, boardId, ...data }: { id: string; boardId?: string } & Partial<Lead>) =>
    api.post(`/leads/${id}/qualify`, boardId ? { ...data, boardId } : data),
  disqualifyLead: (id: string) => api.post(`/leads/${id}/disqualify`),
  logFollowUp: ({ id, note, number }: { id: string; note?: string; number?: number }) =>
    api.post<{ data: Lead }>(`/leads/${id}/follow-ups`, {
      ...(note ? { note } : {}),
      ...(number !== undefined ? { number } : {}),
    }),
  addLeadComment: ({
    id,
    text,
    level,
    format,
  }: {
    id: string;
    text: string;
    level: LeadCommentLevel;
    format?: LeadCommentFormat;
  }) => api.post<ApiResponse<Lead>>(`/leads/${id}/comments`, { text, level, ...(format ? { format } : {}) }),
  updateLeadComment: ({
    id,
    commentId,
    text,
    level,
    format,
  }: {
    id: string;
    commentId: string;
    text?: string;
    level?: LeadCommentLevel;
    format?: LeadCommentFormat;
  }) =>
    api.patch<ApiResponse<Lead>>(`/leads/${id}/comments/${commentId}`, {
      ...(text !== undefined ? { text } : {}),
      ...(level !== undefined ? { level } : {}),
      ...(format !== undefined ? { format } : {}),
    }),
  deleteLeadComment: ({ id, commentId }: { id: string; commentId: string }) =>
    api.delete<ApiResponse<Lead>>(`/leads/${id}/comments/${commentId}`),
  getLeadHistory: (id: string) =>
    api.get<ApiResponse<LeadTimelineEvent[]>>(`/leads/${id}/history`),
  previewLeadExport: (body: LeadExportRequest) =>
    api.post<ApiResponse<LeadExportPreview>>('/leads/export', { ...body, format: 'preview' }),
  downloadLeadExport: (body: LeadExportRequest) =>
    api.post('/leads/export', { ...body, format: 'xlsx' }, { responseType: 'blob' }),
  previewBulkEnrich: (body: {
    filters?: LeadFilters;
    leadIds?: string[];
    reEnrichComplete?: boolean;
    maxPaidLookups?: number;
  }) => api.post<ApiResponse<BulkEnrichPreview>>('/leads/enrich/preview', body),
  runBulkEnrich: (body: {
    filters?: LeadFilters;
    leadIds?: string[];
    reEnrichComplete?: boolean;
    maxPaidLookups?: number;
  }) => api.post<ApiResponse<{ jobId: string; status: string }>>('/leads/enrich/run', body),
  getBulkEnrichJob: (jobId: string) =>
    api.get<ApiResponse<BulkEnrichJobStatus>>(`/leads/enrich/jobs/${jobId}`),
};

export interface BulkEnrichPreview {
  total: number;
  willProcess: number;
  skipComplete: number;
  missingEmailOrPhone: number;
  maxPaidLookups: number;
  cappedPaidEstimate: number;
}

export interface BulkEnrichJobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalLeads: number;
  processed: number;
  skipped: number;
  foundEmail: number;
  foundPhone: number;
  internalCacheHits: number;
  apolloCreditsUsed: number;
  paidLookupsUsed: number;
  maxPaidLookups: number;
  lastError?: string;
}

export const useLeads = (filters: LeadFilters = {}) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['leads', organizationId, filters],
    queryFn: async (): Promise<LeadsListResponse> => {
      const response = await leadApi.getLeads(filters);
      const body = response.data;
      return {
        data: Array.isArray(body.data) ? body.data : [],
        meta: body.meta ?? {
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
          total: Array.isArray(body.data) ? body.data.length : 0,
        },
      };
    },
    staleTime: 1000 * 60,
    placeholderData: (previous, previousQuery) => {
      if (previousQuery?.queryKey[1] !== organizationId) return undefined;
      return previous;
    },
  });
};

export const useLead = (id: string | undefined) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['lead', id, organizationId],
    queryFn: () => leadApi.getLead(id!).then((r) => r.data.data),
    enabled: !!id,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.updateLead,
    onMutate: () => getLeadUpdateScope(),
    onSuccess: async (response, variables, scope) => {
      const saved = response.data.data;
      if (saved?._id === variables.id && scope) {
        if (!await applyLeadUpdateResponse(queryClient, saved, scope)) return;
      }
      scheduleSalesKpiRefresh(queryClient);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leadHistory', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
    },
  });
};

export const useBulkUpload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.bulkUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};

export const useBulkCreateLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.bulkCreateLeads,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};

export const useValidateLeads = () =>
  useMutation({
    mutationFn: leadApi.validateLeads,
  });

export const useQualifyLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.qualifyLead,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leadHistory', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};

export const useDisqualifyLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.disqualifyLead,
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leadHistory', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};

export const usePreviewLeadExport = () =>
  useMutation({
    mutationFn: (body: LeadExportRequest) =>
      leadApi.previewLeadExport(body).then((response) => response.data.data),
  });

export const useDownloadLeadExport = () =>
  useMutation({
    mutationFn: async (body: LeadExportRequest) => {
      const response = await leadApi.downloadLeadExport(body);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leads.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    },
  });

export const useLeadHistory = (id: string | undefined) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['leadHistory', id, organizationId],
    queryFn: async (): Promise<LeadTimelineEvent[]> => {
      const response = await leadApi.getLeadHistory(id!);
      return Array.isArray(response.data.data) ? response.data.data : [];
    },
    enabled: !!id,
  });
};

export const useLogFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.logFollowUp,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leadHistory', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};

const refreshLeadCommentQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  leadId: string,
) => {
  queryClient.invalidateQueries({ queryKey: ['leads'] });
  queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
};

export const useAddLeadComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.addLeadComment,
    onMutate: () => getLeadUpdateScope(),
    onSuccess: async (response, variables, scope) => {
      const saved = response.data.data;
      if (saved?._id === variables.id && scope) {
        if (!await applyLeadUpdateResponse(queryClient, saved, scope)) return;
      }
      scheduleSalesKpiRefresh(queryClient);
      refreshLeadCommentQueries(queryClient, variables.id);
    },
  });
};

export const useUpdateLeadComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.updateLeadComment,
    onMutate: () => getLeadUpdateScope(),
    onSuccess: async (response, variables, scope) => {
      const saved = response.data.data;
      if (saved?._id === variables.id && scope) {
        if (!await applyLeadUpdateResponse(queryClient, saved, scope)) return;
      }
      refreshLeadCommentQueries(queryClient, variables.id);
    },
  });
};

export const useDeleteLeadComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.deleteLeadComment,
    onMutate: () => getLeadUpdateScope(),
    onSuccess: async (response, variables, scope) => {
      const saved = response.data.data;
      if (saved?._id === variables.id && scope) {
        if (!await applyLeadUpdateResponse(queryClient, saved, scope)) return;
      }
      refreshLeadCommentQueries(queryClient, variables.id);
    },
  });
};

export const usePreviewBulkEnrich = () =>
  useMutation({
    mutationFn: (body: {
      filters?: LeadFilters;
      leadIds?: string[];
      reEnrichComplete?: boolean;
      maxPaidLookups?: number;
    }) => leadApi.previewBulkEnrich(body).then((r) => r.data.data),
  });

export const useRunBulkEnrich = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      filters?: LeadFilters;
      leadIds?: string[];
      reEnrichComplete?: boolean;
      maxPaidLookups?: number;
    }) => leadApi.runBulkEnrich(body).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useBulkEnrichJob = (jobId: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ['bulkEnrichJob', jobId],
    queryFn: () => leadApi.getBulkEnrichJob(jobId!).then((r) => r.data.data),
    enabled: enabled && Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 2000;
    },
  });
