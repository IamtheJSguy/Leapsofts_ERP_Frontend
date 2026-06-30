import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { KPIChangeRequest, KpiChangeSource, KpiChangeType, KpiTimeframe, KpiPriority, ChangeEffectiveWhen } from '@/types';

export type SubmitChangeRequestPayload = {
  sourceType: KpiChangeSource;
  type: KpiChangeType;
  reason: string;
  assignmentId?: string;
  assignmentItemId?: string;
  kpiId?: string;
  requestedTargetValue?: number;
  requestedTimeFrame?: KpiTimeframe;
  requestedPriority?: KpiPriority;
  proposedItem?: {
    name: string;
    description?: string;
    targetValue: number;
    timeFrame: KpiTimeframe;
    priority?: KpiPriority;
  };
};

export type ReviewChangeRequestPayload = {
  requestId: string;
  approved: boolean;
  effectiveWhen?: ChangeEffectiveWhen;
  adminNote?: string;
};

const changeRequestApi = {
  submit: (data: SubmitChangeRequestPayload) =>
    api.post<{ data: KPIChangeRequest }>('/kpi-change-requests', data),
  mine: () => api.get<{ data: KPIChangeRequest[] }>('/kpi-change-requests/mine'),
  pending: () => api.get<{ data: KPIChangeRequest[] }>('/kpi-change-requests'),
  review: ({ requestId, ...body }: ReviewChangeRequestPayload) =>
    api.post<{ data: KPIChangeRequest }>(`/kpi-change-requests/${requestId}/review`, body),
};

const invalidateAll = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['kpi-change-requests'] });
  queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
  queryClient.invalidateQueries({ queryKey: ['kpi-template-assignments'] });
  queryClient.invalidateQueries({ queryKey: ['myKpis'] });
  queryClient.invalidateQueries({ queryKey: ['kpis'] });
  queryClient.invalidateQueries({ queryKey: ['daily-kpis'] });
  queryClient.invalidateQueries({ queryKey: ['dailyKpiEntries'] });
};

export const useMyKPIChangeRequests = () =>
  useQuery({
    queryKey: ['kpi-change-requests', 'mine'],
    queryFn: () => changeRequestApi.mine().then((r) => r.data.data),
  });

export const usePendingKPIChangeRequests = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['kpi-change-requests', 'pending'],
    queryFn: () => changeRequestApi.pending().then((r) => r.data.data),
    enabled: options?.enabled !== false,
  });

export const useSubmitKPIChangeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeRequestApi.submit,
    onSuccess: () => invalidateAll(queryClient),
  });
};

export const useReviewKPIChangeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeRequestApi.review,
    onSuccess: () => invalidateAll(queryClient),
  });
};
