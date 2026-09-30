import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { ApiResponse, IcpEntry, ProfileEntry, SystemSettings } from '@/types';

export const useSystemSettings = () => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['systemSettings', organizationId],
    queryFn: () =>
      api.get<ApiResponse<SystemSettings>>('/admin/settings').then((r) => r.data.data),
  });
};

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SystemSettings) => api.put('/admin/settings', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systemSettings'] }),
  });
};

export const useIcps = () => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['icps', organizationId],
    queryFn: () =>
      api.get<ApiResponse<IcpEntry[]>>('/admin/settings/icps').then((r) => r.data.data),
  });
};

const invalidateIcpQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
  queryClient.invalidateQueries({ queryKey: ['icps'] });
};

export const useAddIcp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post('/admin/settings/icps', { name }),
    onSuccess: () => invalidateIcpQueries(queryClient),
  });
};

export const useRenameIcp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ icpId, name }: { icpId: string; name: string }) =>
      api.patch(`/admin/settings/icps/${icpId}`, { name }),
    onSuccess: () => invalidateIcpQueries(queryClient),
  });
};

export const useRemoveIcp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (icpId: string) => api.delete(`/admin/settings/icps/${icpId}`),
    onSuccess: () => invalidateIcpQueries(queryClient),
  });
};

export const useProfiles = () => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['profiles', organizationId],
    queryFn: () =>
      api.get<ApiResponse<ProfileEntry[]>>('/admin/settings/profiles').then((r) => r.data.data),
  });
};

const invalidateProfileQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
  queryClient.invalidateQueries({ queryKey: ['profiles'] });
};

export const useAddProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post('/admin/settings/profiles', { name }),
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
};

export const useRenameProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, name }: { profileId: string; name: string }) =>
      api.patch(`/admin/settings/profiles/${profileId}`, { name }),
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
};

export const useRemoveProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.delete(`/admin/settings/profiles/${profileId}`),
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
};
