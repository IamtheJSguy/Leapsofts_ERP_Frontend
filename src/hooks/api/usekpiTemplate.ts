import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { KPITemplate, KpiPriority, KpiRecurrenceMode, KpiScheduleMode } from '@/types';

export type ItemOverride = {
  itemIndex: number;
  targetValue?: number;
  priority?: KpiPriority;
  dueDate?: string;
  daysOfWeek?: number[];
  scheduleMode?: KpiScheduleMode;
  startTime?: string | null;
  endTime?: string | null;
  recurrenceMode?: KpiRecurrenceMode;
};

const kpiTemplateApi = {
  getKPITemplates: () => api.get<{ data: KPITemplate[] }>('/kpi-templates'),
  createKPITemplate: (data: Partial<KPITemplate>) => api.post<{ data: KPITemplate }>('/kpi-templates', data),
  updateKPITemplate: ({ id, data }: { id: string; data: Partial<KPITemplate> }) =>
    api.put<{ data: KPITemplate }>(`/kpi-templates/${id}`, data),
  deleteKPITemplate: (id: string) => api.delete<{ success: boolean }>(`/kpi-templates/${id}`),
  assignKPITemplate: ({
    id,
    userIds,
    overrides,
  }: {
    id: string;
    userIds: string[];
    overrides?: Record<string, ItemOverride[]>;
  }) => api.post<{ success: boolean }>(`/kpi-templates/${id}/assign`, { userIds, overrides }),
  getMyAssignments: () => api.get<{ data: any[] }>('/kpi-templates/my-assignments'),
  getKPITemplateAssignments: () => api.get<{ data: any[] }>('/kpi-templates/assignments'),
  unassignKPITemplate: ({ id, userId }: { id: string; userId: string }) =>
    api.post<{ success: boolean }>(`/kpi-templates/${id}/unassign`, { userIds: [userId] }),
  removeAssignmentItem: ({
    templateId,
    userId,
    assignmentItemId,
  }: {
    templateId: string;
    userId: string;
    assignmentItemId: string;
  }) =>
    api.post<{ success: boolean }>(`/kpi-templates/${templateId}/assignment/remove-item`, {
      userId,
      assignmentItemId,
    }),
};

export const useKPITemplates = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['kpiTemplates'],
    queryFn: () => kpiTemplateApi.getKPITemplates().then((r) => r.data.data),
    enabled: options?.enabled,
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
      queryClient.invalidateQueries({ queryKey: ['daily-kpis'] });
    },
  });
};

export const useRemoveAssignmentItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiTemplateApi.removeAssignmentItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['kpiTemplateAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['daily-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dailyKpiEntries'] });
    },
  });
};
