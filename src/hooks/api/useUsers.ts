import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { User } from '@/types';

const userApi = {
  getUsers: (params: Record<string, string>) =>
    api.get<{ data: User[] }>('/users', { params }),
  getUser: (id: string) => api.get<{ data: User }>(`/users/${id}`),
  createUser: (data: Partial<User> & { password?: string }) => api.post('/users', data),
  updateUser: ({ id, data }: { id: string; data: Partial<User> }) =>
    api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  updateRole: ({ id, role }: { id: string; role: string }) =>
    api.put(`/users/${id}/role`, { role }),
  updateMe: (data: Partial<User>) => api.put('/users/me', data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put('/users/me/change-password', data),
  getMe: () => api.get<{ data: User }>('/users/me'),
};

export const useUsers = (
  filters: Record<string, string> = {},
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: ['users', filters],
    queryFn: () => userApi.getUsers(filters).then((r) => r.data.data),
    staleTime: 1000 * 600,
    ...options,
  });

export const useUser = (id: string | undefined) =>
  useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getUser(id!).then((r) => r.data.data),
    enabled: !!id,
  });

export const useUserSummary = (userId: string | undefined, date?: string) =>
  useQuery({
    queryKey: ['userSummary', userId, date],
    queryFn: () =>
      api
        .get<{ data: any }>(`/users/${userId}/summary`, {
          params: date ? { date } : undefined,
        })
        .then((r) => r.data.data),
    enabled: !!userId,
  });

export const useUserAttendanceSummary = (
  userId: string | undefined,
  startDate: string,
  endDate: string
) =>
  useQuery({
    queryKey: ['userAttendanceSummary', userId, startDate, endDate],
    queryFn: () =>
      api
        .get<{ data: any }>(`/users/${userId}/attendance-summary`, {
          params: { startDate, endDate },
        })
        .then((r) => r.data.data),
    enabled: !!userId && !!startDate && !!endDate,
  });

export const useUserAuditLogs = (userId: string | undefined, page = 1, limit = 20) =>
  useQuery({
    queryKey: ['auditLogs', userId, page, limit],
    queryFn: () =>
      api
        .get<{ data: any[]; meta: { page: number; limit: number; total: number } }>(`/admin/audit-logs/${userId}`, {
          params: { page, limit },
        })
        .then((r) => r.data),
    enabled: !!userId,
  });

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateUser,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] }); // or however auth is cached
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: userApi.changePassword,
  });

import { useAuthStore } from '@/store/useAuthStore';

export const useMe = () => {
  const updateAuthUser = useAuthStore((s) => s.updateUser);
  return useQuery({
    queryKey: ['me'],
    queryFn: () => userApi.getMe().then((r) => {
      if (r.data?.data) {
        updateAuthUser(r.data.data);
        return r.data.data;
      }
      return null;
    }),
  });
};
