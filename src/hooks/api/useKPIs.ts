import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { KPI, KPIRecord, ChangeRequest } from '@/types';

const kpiApi = {
  getKPIs: () => api.get<{ data: KPI[] }>('/kpis/my'),
  getMyKPIs: () => api.get<{ data: KPI[] }>('/kpis/my'),
  getKPIRecords: (params: Record<string, string>) =>
    api.get<{ data: KPIRecord[] }>('/kpis/records', { params }),
  createKPI: (data: Partial<KPI>) => api.post('/kpis', data),
  updateKPI: ({ id, data }: { id: string; data: Partial<KPI> }) =>
    api.put(`/kpis/${id}`, data),
  requestChange: ({ id, data }: { id: string; data: { proposedTarget: number; reason: string } }) =>
    api.post(`/kpis/${id}/request-change`, data),
  approveChange: ({
    id,
    requestId,
    decision,
  }: {
    id: string;
    requestId: string;
    decision: 'approved' | 'rejected';
  }) => api.post(`/kpis/${id}/approve-change`, { requestId, decision }),
  getChangeRequests: () => api.get<{ data: ChangeRequest[] }>('/kpis/change-requests'),
};

export const useKPIs = () =>
  useQuery({
    queryKey: ['kpis'],
    queryFn: () => kpiApi.getKPIs().then((r) => r.data.data),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kpis'] }),
  });
};

export const useRequestKPIChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiApi.requestChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['myKpis'] });
      queryClient.invalidateQueries({ queryKey: ['changeRequests'] });
    },
  });
};

export const useApproveKPIChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiApi.approveChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['myKpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpiRecords'] });
      queryClient.invalidateQueries({ queryKey: ['changeRequests'] });
    },
  });
};

export const useChangeRequests = () =>
  useQuery({
    queryKey: ['changeRequests'],
    queryFn: () => kpiApi.getChangeRequests().then((r) => r.data.data),
  });
