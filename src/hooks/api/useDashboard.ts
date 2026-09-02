import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { DashboardStats, PipelineOverviewSummary } from '@/types';

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<{ data: DashboardStats }>('users/me/summary').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });

export const useAdminDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'admin', 'pipeline-overview'],
    queryFn: () =>
      api.get<{ data: PipelineOverviewSummary }>('/admin/pipeline-overview').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });

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

export const useMyDashboardTasks = () =>
  useQuery({
    queryKey: ['dashboard', 'me', 'tasks'],
    queryFn: () =>
      api.get<{ data: DashboardTasksResponse }>('/users/me/dashboard-tasks').then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
