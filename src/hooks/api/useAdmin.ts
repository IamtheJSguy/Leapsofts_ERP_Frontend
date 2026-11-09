import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

export type AdminUsageData = {
  usage: Record<string, number | string | null>;
};

const adminApi = {
  getUsage: () => api.get<{ data: AdminUsageData }>('/admin/usage'),
  revokeSessions: () => api.post('/admin/sessions/revoke', {}),
};

export const useAdminUsage = (enabled = true) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['admin', 'usage', organizationId],
    enabled,
    queryFn: () => adminApi.getUsage().then((r) => r.data.data),
  });
};

export const useRevokeAdminSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.revokeSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'usage'] });
    },
  });
};

export type MonitoringConfig = {
  screenshotsEnabled?: boolean;
  appUsageEnabled?: boolean;
};

export const useMonitoringConfig = (enabled: boolean) => {
  return useQuery({
    queryKey: ['admin', 'monitoring-config'],
    enabled,
    queryFn: () =>
      api.get<{ data: MonitoringConfig }>('/admin/monitoring-config').then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });
};

export const useAcknowledgeMonitoring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/users/me/acknowledge-monitoring'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
