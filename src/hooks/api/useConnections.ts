import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ConnectionStatus } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

export interface SalesPipelineStats {
  totalProspects: number;
  pendingConnections?: number;
  connectionsSent: number;
  acceptedConnections: number;
  messageSent: number;
  responded: number;
  followUp: number;
  followUp1: number;
  followUp2: number;
  negative: number;
  positive: number;
  futureLeads: number;
  futureLeadsDueSoon: number;
  inConversation?: number;
  qualified?: number;
  conversionRates: {
    sentRate?: number;
    pendingRate?: number;
    acceptRate: number;
    messageSentRate: number;
    respondedRate: number;
    followUpRate: number;
    followUp1Rate: number;
    followUp2Rate: number;
    negativeRate: number;
    positiveRate: number;
    conversationRate?: number;
    qualifiedRate?: number;
  };
  messageStats?: Record<string, number>;
}

const connectionApi = {
  getStats: (params: Record<string, string>) =>
    api.get('/connections/stats', { params }),
  getRatios: (params: Record<string, string>) =>
    api.get('/connections/ratios', { params }),
  getPipelineStats: (params?: Record<string, string>) =>
    api.get<{ data: SalesPipelineStats }>('/connections/pipeline', { params }),
  updateStatus: ({ leadId, status }: { leadId: string; status: ConnectionStatus }) =>
    api.put(`/connections/${leadId}/status`, { status }),
};

export const useConnectionStats = (filters: Record<string, string> = {}) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['connectionStats', organizationId, filters],
    queryFn: () => connectionApi.getStats(filters).then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
};

export const useSalesPipelineStats = (params?: Record<string, string>) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['salesPipelineStats', organizationId, params],
    queryFn: () => connectionApi.getPipelineStats(params).then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
};

export const useConnectionRatios = (filters: Record<string, string> = {}) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['connectionRatios', organizationId, filters],
    queryFn: () => connectionApi.getRatios(filters).then((r) => r.data.data),
  });
};

export const useUpdateConnectionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectionApi.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectionStats'] });
      queryClient.invalidateQueries({ queryKey: ['connectionRatios'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
