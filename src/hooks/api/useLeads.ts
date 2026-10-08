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
  getLeadHistory: (id: string) =>
    api.get<ApiResponse<LeadTimelineEvent[]>>(`/leads/${id}/history`),
  previewLeadExport: (body: LeadExportRequest) =>
    api.post<ApiResponse<LeadExportPreview>>('/leads/export', { ...body, format: 'preview' }),
  downloadLeadExport: (body: LeadExportRequest) =>
    api.post('/leads/export', { ...body, format: 'xlsx' }, { responseType: 'blob' }),
};

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
