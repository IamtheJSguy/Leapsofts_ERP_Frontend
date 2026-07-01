import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { DashboardStats } from '@/types';

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<{ data: DashboardStats }>('users/me').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });

export const useAdminDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () =>
      api.get<{ data: DashboardStats }>('/dashboard/admin').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
