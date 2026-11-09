import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { CreateMeetingPayload, Meeting } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

const meetingApi = {
  getMeetings: (params: Record<string, string>) =>
    api.get<{ data: Meeting[] }>('/meetings', { params }),
  getMeeting: (id: string) => api.get<{ data: Meeting }>(`/meetings/${id}`),
  createMeeting: (data: CreateMeetingPayload) => api.post('/meetings', data),
  updateMeeting: ({ id, data }: { id: string; data: CreateMeetingPayload }) =>
    api.put(`/meetings/${id}`, data),
  deleteMeeting: (id: string) => api.delete(`/meetings/${id}`),
  retryCalendarSync: (id: string) => api.post(`/meetings/${id}/calendar/sync`),
};

export const prefetchMeetings = (client: QueryClient) => {
  const organizationId = useAuthStore.getState().user?.organizationId;
  const filters: Record<string, string> = {};
  return client.prefetchQuery({
    queryKey: ['meetings', organizationId, filters],
    queryFn: () => meetingApi.getMeetings(filters).then((r) => r.data.data),
    staleTime: 60_000,
  });
};

export const useMeetings = (
  filters: Record<string, string> = {},
  options?: { enabled?: boolean },
) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['meetings', organizationId, filters],
    queryFn: () => meetingApi.getMeetings(filters).then((r) => r.data.data),
    enabled: options?.enabled ?? true,
  });
};

export const useMeeting = (id: string | undefined) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['meeting', id, organizationId],
    queryFn: () => meetingApi.getMeeting(id!).then((r) => r.data.data),
    enabled: !!id,
  });
};

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingApi.createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
    },
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingApi.updateMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
    },
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingApi.deleteMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const useRetryMeetingCalendarSync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingApi.retryCalendarSync(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting'] });
    },
  });
};
