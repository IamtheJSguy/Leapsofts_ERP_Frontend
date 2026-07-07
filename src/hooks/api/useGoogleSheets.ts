import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const googleSheetsApi = {
  syncGoogleSheet: (userId: string) =>
    api.post<{ success: boolean; data?: any }>(`/sheets/${userId}/sync`),
  syncMySheet: () => 
    api.post<{ success: boolean; data?: any }>('/sheets/sync-my-sheet'),
};

export const useSyncGoogleSheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: googleSheetsApi.syncGoogleSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
    },
  });
};

export const useSyncMySheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: googleSheetsApi.syncMySheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
    },
  });
};
