import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { User } from '@/types';

const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (data: Record<string, string>) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ data: User }>('/auth/me'),
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      setAuth(res.data.data.user);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      setAuth(res.data.data.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      clearAuth();
      queryClient.clear();
    },
  });
};

export const useCurrentUser = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.me();
      setAuth(res.data.data);
      return res.data.data;
    },
    staleTime: Infinity,
    retry: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (data: { googleSheetId?: string; firstName?: string; lastName?: string }) =>
      api.put('/users/me', data),
    onSuccess: (res) => {
      setAuth(res.data.data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useSyncMySheet = () => {
  return useMutation({
    mutationFn: () => api.post('/sheets/sync-my-sheet'),
  });
};
