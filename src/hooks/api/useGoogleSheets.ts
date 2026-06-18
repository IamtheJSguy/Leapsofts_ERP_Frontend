import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const googleSheetsApi = {
  syncGoogleSheet: (sheetId: string) =>
    api.post<{ success: boolean; data?: any }>(`/sheets/${sheetId}/sync`),
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
    },
  });
};
