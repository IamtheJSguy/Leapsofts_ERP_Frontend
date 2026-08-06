import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type {
  GroupedSalesKpis,
  SalesKpiAssignment,
  SalesKpiAssignResult,
  SalesKpiAssignmentUpdatePayload,
  SalesKpiEntry,
  SalesKpiItemOverride,
  SalesKpiSummary,
  SalesKpiTemplate,
  SalesKpiTemplateDetail,
  SalesKpiTemplateItem,
} from '@/types';

export interface SalesKpiTemplatePayload {
  name: string;
  description?: string;
  items: SalesKpiTemplateItem[];
}

/** Days of finished history the board includes alongside live tasks (backend default: 7, max 90). */
export interface SalesKpiWindowParams {
  days?: number;
}

export interface TeamSalesKpisParams {
  startDate: string;
  endDate: string;
  userId?: string;
}

const salesKpiApi = {
  getMySalesKpis: (params?: SalesKpiWindowParams) =>
    api.get<{ success: boolean; data: GroupedSalesKpis }>('/sales-kpis/my', { params }),
  getSalesKpiSummary: (params?: SalesKpiWindowParams) =>
    api.get<{ success: boolean; data: SalesKpiSummary }>('/sales-kpis/summary', { params }),
  getTeamSalesKpis: (params: TeamSalesKpisParams) =>
    api.get<{ success: boolean; data: SalesKpiEntry[] }>('/sales-kpis/team', { params }),

  getTemplates: () => api.get<{ success: boolean; data: SalesKpiTemplate[] }>('/sales-kpi-templates'),
  getTemplate: (id: string) =>
    api.get<{ success: boolean; data: SalesKpiTemplateDetail }>(`/sales-kpi-templates/${id}`),
  createTemplate: (data: SalesKpiTemplatePayload) =>
    api.post<{ success: boolean; data: SalesKpiTemplate }>('/sales-kpi-templates', data),
  updateTemplate: ({ id, data }: { id: string; data: Partial<SalesKpiTemplatePayload> }) =>
    api.put<{ success: boolean; data: SalesKpiTemplate }>(`/sales-kpi-templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete<{ success: boolean }>(`/sales-kpi-templates/${id}`),
  assignTemplate: ({
    id,
    userIds,
    overrides,
  }: {
    id: string;
    userIds: string[];
    overrides?: Record<string, SalesKpiItemOverride[]>;
  }) =>
    api.post<{ success: boolean; data: SalesKpiAssignResult }>(`/sales-kpi-templates/${id}/assign`, {
      userIds,
      overrides,
    }),

  getMyAssignments: () =>
    api.get<{ success: boolean; data: SalesKpiAssignment[] }>('/sales-kpi-templates/my-assignments'),
  getAssignments: () =>
    api.get<{ success: boolean; data: SalesKpiAssignment[] }>('/sales-kpi-templates/assignments'),
  updateAssignment: ({ id, ...data }: { id: string } & SalesKpiAssignmentUpdatePayload) =>
    api.put<{ success: boolean; data: SalesKpiAssignment }>(
      `/sales-kpi-templates/assignments/${id}`,
      data,
    ),
  deleteAssignment: (id: string) =>
    api.delete<{ success: boolean }>(`/sales-kpi-templates/assignments/${id}`),
};

// ─── User-facing (read-only) ──────────────────────────────────────

export const useMySalesKpis = (params?: SalesKpiWindowParams, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['salesKpis', 'my', params?.days ?? null],
    queryFn: () => salesKpiApi.getMySalesKpis(params).then((r) => r.data.data),
    enabled: options?.enabled,
  });

export const useSalesKpiSummary = (params?: SalesKpiWindowParams, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['salesKpiSummary', params?.days ?? null],
    queryFn: () => salesKpiApi.getSalesKpiSummary(params).then((r) => r.data.data),
    enabled: options?.enabled,
  });

/** Elevated team progress: sales KPIs overlapping / completed in a date range. */
export const useTeamSalesKpis = (
  params: TeamSalesKpisParams | null,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ['salesKpis', 'team', params],
    queryFn: () => salesKpiApi.getTeamSalesKpis(params!).then((r) => r.data.data),
    enabled: (options?.enabled ?? true) && !!params?.startDate && !!params?.endDate,
  });

export const useMySalesKpiAssignments = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['mySalesKpiAssignments'],
    queryFn: () => salesKpiApi.getMyAssignments().then((r) => r.data.data),
    enabled: options?.enabled,
  });

// ─── Templates (elevated) ─────────────────────────────────────────

export const useSalesKpiTemplates = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['salesKpiTemplates'],
    queryFn: () => salesKpiApi.getTemplates().then((r) => r.data.data),
    enabled: options?.enabled,
  });

/** Template plus the assignments derived from it. */
export const useSalesKpiTemplateDetail = (id: string | undefined) =>
  useQuery({
    queryKey: ['salesKpiTemplates', id],
    queryFn: () => salesKpiApi.getTemplate(id!).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateSalesKpiTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesKpiApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesKpiTemplates'] });
    },
  });
};

export const useUpdateSalesKpiTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesKpiApi.updateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesKpiTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiAssignments'] });
    },
  });
};

export const useDeleteSalesKpiTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesKpiApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesKpiTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
    },
  });
};

export const useAssignSalesKpiTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesKpiApi.assignTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesKpiTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['mySalesKpiAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};

// ─── Assignments (elevated) ───────────────────────────────────────

export const useSalesKpiAssignments = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['salesKpiAssignments'],
    queryFn: () => salesKpiApi.getAssignments().then((r) => r.data.data),
    enabled: options?.enabled,
  });

export const useUpdateSalesKpiAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesKpiApi.updateAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesKpiAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['mySalesKpiAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};

export const useDeleteSalesKpiAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesKpiApi.deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesKpiAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['mySalesKpiAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
      queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
    },
  });
};
