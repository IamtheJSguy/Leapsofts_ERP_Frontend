import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ApiResponse, SystemSettings } from '@/types';

export const useSystemSettings = () =>
  useQuery({
    queryKey: ['systemSettings'],
    queryFn: () =>
      api.get<ApiResponse<SystemSettings>>('/admin/settings').then((r) => r.data.data),
  });

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SystemSettings) => api.put('/admin/settings', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systemSettings'] }),
  });
};
