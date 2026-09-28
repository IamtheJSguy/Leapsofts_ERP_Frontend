import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { DashboardStats, PipelineOverviewSummary } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

export const useDashboard = () => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['dashboard', organizationId],
    queryFn: () => api.get<{ data: DashboardStats }>('users/me/summary').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
};

export const useAdminDashboard = () => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['dashboard', 'admin', 'pipeline-overview', organizationId],
    queryFn: () =>
      api.get<{ data: PipelineOverviewSummary }>('/admin/pipeline-overview').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
};

export type DashboardTaskKind = 'sales' | 'daily';

export type DashboardTask = {
  id: string;
  title: string;
  kind: DashboardTaskKind;
  dueDate: string;
  isOverdue: boolean;
  currentValue?: number;
  targetValue?: number;
};

export type DashboardTasksResponse = {
  tasks: DashboardTask[];
  overdueCount: number;
};

export const useMyDashboardTasks = () => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['dashboard', 'me', 'tasks', organizationId],
    queryFn: () =>
      api.get<{ data: DashboardTasksResponse }>('/users/me/dashboard-tasks').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
};
