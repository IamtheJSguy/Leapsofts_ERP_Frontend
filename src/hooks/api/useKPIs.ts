import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { KPI, KPIRecord } from '@/types';

const kpiApi = {
  getKPIs: () => api.get<{ data: KPI[] }>('/kpis'),
  getMyKPIs: () => api.get<{ data: KPI[] }>('/kpis/my'),
  getKPIRecords: (params: Record<string, string>) =>
    api.get<{ data: KPIRecord[] }>('/kpis/records', { params }),
  createKPI: (data: Partial<KPI>) => api.post('/kpis', data),
  updateKPI: ({ id, data }: { id: string; data: Partial<KPI> }) =>
    api.put(`/kpis/${id}`, data),
  deleteKPI: (id: string) => api.delete(`/kpis/${id}`),
  getDailyEntries: (params: {
    date?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
  }) => api.get<{ data: any[] }>('/kpis/daily-entries', { params }),
};

export type DailyKpiEntriesParams = {
  date?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
};

export const useDailyKpiEntries = (params: DailyKpiEntriesParams) =>
  useQuery({
    queryKey: ['dailyKpiEntries', params],
    queryFn: () => kpiApi.getDailyEntries(params).then((r) => r.data.data),
    enabled: !!(params.date || (params.startDate && params.endDate)),
  });

export const useKPIs = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['kpis'],
    queryFn: () => kpiApi.getKPIs().then((r) => r.data.data),
    enabled: options?.enabled,
  });

export const useMyKPIs = () =>
  useQuery({
    queryKey: ['myKpis'],
    queryFn: () => kpiApi.getMyKPIs().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

export const useKPIRecords = (params: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['kpiRecords', params],
    queryFn: () => kpiApi.getKPIRecords(params).then((r) => r.data.data),
  });

export const useCreateKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiApi.createKPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['myKpis'] });
    },
  });
};

export const useUpdateKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiApi.updateKPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['myKpis'] });
    },
  });
};

export const useDeleteKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiApi.deleteKPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['myKpis'] });
    },
  });
};
