import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import type { User } from '@/types';
import { discardQueryCacheForSessionChange } from '@/lib/queryPersistence';
import {
  clearMonitoringPromptSession,
  markMonitoringPromptPendingForLogin,
} from '@/utils/monitoringPromptSession';

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
    onSuccess: async (res) => {
      const data = res.data.data;
      if (data.requires2FA || data.requires2FASetup) return;
      if (data.accessToken && data.user) {
        const previousUserId = useAuthStore.getState().user?._id;
        localStorage.setItem('accessToken', data.accessToken);
        await queryClient.cancelQueries();
        await discardQueryCacheForSessionChange([previousUserId, data.user._id]);
        markMonitoringPromptPendingForLogin();
        setAuth(data.user);
      }
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async (res) => {
      const previousUserId = useAuthStore.getState().user?._id;
      const user = res.data.data.user;
      localStorage.setItem('accessToken', res.data.data.accessToken);
      await discardQueryCacheForSessionChange([previousUserId, user?._id]);
      markMonitoringPromptPendingForLogin();
      setAuth(user);
    },
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      const userId = useAuthStore.getState().user?._id;
      localStorage.removeItem('accessToken');
      clearMonitoringPromptSession();
      await discardQueryCacheForSessionChange([userId]);
      clearAuth();
    },
  });
};

export const useSwitchOrganization = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (organizationId: string) =>
      api.post('/auth/switch-organization', { organizationId }),
    onSuccess: async (res) => {
      const data = res.data.data;
      if (data.accessToken && data.user) {
        localStorage.setItem('accessToken', data.accessToken);
        await queryClient.cancelQueries();
        // Org switch must not re-arm the workplace monitoring prompt.
        setAuth(data.user);
        useChatStore.getState().resetChatSession();
        import('@/lib/socket').then(({ reconnectSocketWithToken }) => {
          reconnectSocketWithToken(data.accessToken);
        });
      }
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
