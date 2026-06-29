import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ConnectionStatus } from '@/types';

export interface SalesPipelineStats {
  totalProspects: number;
  acceptedConnections: number;
  inConversation: number;
  qualified: number;
  pending: number;
  declined: number;
  noResponse: number;
  conversionRates: {
    acceptRate: number;
    conversationRate: number;
    qualifiedRate: number;
  };
}

const connectionApi = {
  getStats: (params: Record<string, string>) =>
    api.get('/connections/stats', { params }),
  getRatios: (params: Record<string, string>) =>
    api.get('/connections/ratios', { params }),
  getPipelineStats: () =>
    api.get<{ data: SalesPipelineStats }>('/connections/pipeline'),
  updateStatus: ({ leadId, status }: { leadId: string; status: ConnectionStatus }) =>
    api.put(`/connections/${leadId}/status`, { status }),
};

export const useConnectionStats = (filters: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['connectionStats', filters],
    queryFn: () => connectionApi.getStats(filters).then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

export const useSalesPipelineStats = () =>
  useQuery({
    queryKey: ['salesPipelineStats'],
    queryFn: () => connectionApi.getPipelineStats().then((r) => r.data.data),
    staleTime: 1000 * 60,
  });

export const useConnectionRatios = (filters: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['connectionRatios', filters],
    queryFn: () => connectionApi.getRatios(filters).then((r) => r.data.data),
  });

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
