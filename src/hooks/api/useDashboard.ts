import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { DashboardStats, TodaySalesSummary } from '@/types';

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<{ data: DashboardStats }>('users/me/summary').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });

export const useAdminDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'admin', 'today-sales'],
    queryFn: () =>
      api.get<{ data: TodaySalesSummary }>('/admin/today-sales').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
