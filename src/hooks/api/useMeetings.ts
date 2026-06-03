import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Meeting } from '@/types';

const meetingApi = {
  getMeetings: (params: Record<string, string>) =>
    api.get<{ data: Meeting[] }>('/meetings', { params }),
  getMeeting: (id: string) => api.get<{ data: Meeting }>(`/meetings/${id}`),
  createMeeting: (data: Partial<Meeting>) => api.post('/meetings', data),
  updateMeeting: ({ id, data }: { id: string; data: Partial<Meeting> }) =>
    api.put(`/meetings/${id}`, data),
  deleteMeeting: (id: string) => api.delete(`/meetings/${id}`),
};

export const useMeetings = (filters: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['meetings', filters],
    queryFn: () => meetingApi.getMeetings(filters).then((r) => r.data.data),
  });

export const useMeeting = (id: string | undefined) =>
  useQuery({
    queryKey: ['meeting', id],
    queryFn: () => meetingApi.getMeeting(id!).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingApi.createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingApi.updateMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingApi.deleteMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};
