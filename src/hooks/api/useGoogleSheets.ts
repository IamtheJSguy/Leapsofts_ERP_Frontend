import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const googleSheetsApi = {
  syncGoogleSheet: (sheetId: string) =>
    api.post<{ success: boolean; data?: any }>(`/sheets/${sheetId}/sync`),
};

export const useSyncGoogleSheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: googleSheetsApi.syncGoogleSheet,
    onSuccess: () => {
      // Invalidate relevant queries to keep the UI synchronized
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};
