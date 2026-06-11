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
