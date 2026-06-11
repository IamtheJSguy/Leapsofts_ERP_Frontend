import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { KPITemplate } from '@/types';

const kpiTemplateApi = {
  getKPITemplates: () => api.get<{ data: KPITemplate[] }>('/kpi-templates'),
  createKPITemplate: (data: Partial<KPITemplate>) => api.post<{ data: KPITemplate }>('/kpi-templates', data),
  updateKPITemplate: ({ id, data }: { id: string; data: Partial<KPITemplate> }) =>
    api.put<{ data: KPITemplate }>(`/kpi-templates/${id}`, data),
  deleteKPITemplate: (id: string) => api.delete<{ success: boolean }>(`/kpi-templates/${id}`),
  assignKPITemplate: ({ id, userIds }: { id: string; userIds: string[] }) =>
    api.post<{ success: boolean }>(`/kpi-templates/${id}/assign`, { userIds }),
  getMyAssignments: () => api.get<{ data: any[] }>('/kpi-templates/my-assignments'),
  getKPITemplateAssignments: () => api.get<{ data: any[] }>('/kpi-templates/assignments'),
  unassignKPITemplate: ({ id, userId }: { id: string; userId: string }) =>
    api.post<{ success: boolean }>(`/kpi-templates/${id}/unassign`, { userIds: [userId] }),
};

export const useKPITemplates = () =>
  useQuery({
    queryKey: ['kpiTemplates'],
    queryFn: () => kpiTemplateApi.getKPITemplates().then((r) => r.data.data),
  });

export const useCreateKPITemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiTemplateApi.createKPITemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpiTemplates'] });
    },
  });
};

export const useUpdateKPITemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiTemplateApi.updateKPITemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpiTemplates'] });
    },
  });
};

export const useDeleteKPITemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiTemplateApi.deleteKPITemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpiTemplates'] });
    },
  });
};

export const useAssignKPITemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiTemplateApi.assignKPITemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpiTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpiRecords'] });
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['kpiTemplateAssignments'] });
    },
  });
};

export const useMyAssignments = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['myAssignments'],
    queryFn: () => kpiTemplateApi.getMyAssignments().then((r) => r.data.data),
    enabled: options?.enabled,
  });

export const useKPITemplateAssignments = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['kpiTemplateAssignments'],
    queryFn: () => kpiTemplateApi.getKPITemplateAssignments().then((r) => r.data.data),
    enabled: options?.enabled,
  });

export const useUnassignKPITemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiTemplateApi.unassignKPITemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpiTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpiRecords'] });
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['kpiTemplateAssignments'] });
    },
  });
};
