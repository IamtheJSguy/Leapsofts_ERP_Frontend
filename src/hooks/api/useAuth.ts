import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { User } from '@/types';

const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (data: Record<string, string>) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ data: User }>('/users/me'),
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      const data = res.data.data;
      if (data.requires2FA || data.requires2FASetup) return;
      if (data.accessToken && data.user) {
        localStorage.setItem('accessToken', data.accessToken);
        queryClient.clear();
        setAuth(data.user);
      }
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
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60, // 60 seconds
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
