import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { DashboardDateMeta, TeamConnectionRow, TeamProgressRow, PipelineVelocityPoint, TeamAnalysisData } from '@/types';

export type DashboardPeriod = 'today' | 'week' | 'month' | 'quarter' | 'all' | 'custom';

const mapConnectionsPeriod = (label: string): DashboardPeriod => {
  switch (label) {
    case 'Today':
      return 'today';
    case 'This Week':
      return 'week';
    case 'This Month':
      return 'month';
    case 'All Time':
      return 'all';
    case 'Custom':
      return 'custom';
    default:
      return 'week';
  }
};

const mapProgressPeriod = (label: string): DashboardPeriod => {
  switch (label) {
    case 'This Week':
      return 'week';
    case 'This Month':
      return 'month';
    case 'This Quarter':
      return 'quarter';
    case 'All Time':
      return 'all';
    default:
      return 'month';
  }
};

export const useTeamConnections = (
  periodLabel: string,
  options: { search?: string; startDate?: string; endDate?: string } = {},
) => {
  const period = mapConnectionsPeriod(periodLabel);

  return useQuery({
    queryKey: ['admin', 'team-connections', period, options.search, options.startDate, options.endDate],
    queryFn: () =>
      api
        .get<{ data: TeamConnectionRow[]; meta: DashboardDateMeta }>('/admin/team-connections', {
          params: {
            period,
            search: options.search || undefined,
            startDate: options.startDate,
            endDate: options.endDate,
          },
        })
        .then((r) => r.data),
    staleTime: 1000 * 60,
  });
};

export const useTeamProgress = (
  periodLabel: string,
  userIds: string[],
  options: { startDate?: string; endDate?: string; enabled?: boolean } = {},
) => {
  const period = mapProgressPeriod(periodLabel);

  return useQuery({
    queryKey: ['admin', 'team-progress', period, userIds, options.startDate, options.endDate],
    queryFn: () =>
      api
        .get<{ data: TeamProgressRow[]; meta: DashboardDateMeta }>('/admin/team-progress', {
          params: {
            period,
            userIds: userIds.length > 0 ? userIds.join(',') : undefined,
            startDate: options.startDate,
            endDate: options.endDate,
          },
        })
        .then((r) => r.data),
    staleTime: 1000 * 60,
    enabled: options.enabled ?? true,
  });
};

export const usePipelineVelocity = (days = 7) =>
  useQuery({
    queryKey: ['admin', 'pipeline-velocity', days],
    queryFn: () =>
      api
        .get<{ data: PipelineVelocityPoint[]; meta: DashboardDateMeta & { days?: number } }>(
          '/admin/pipeline-velocity',
          { params: { days } },
        )
        .then((r) => r.data),
    staleTime: 1000 * 60,
  });

export const useTeamAnalysis = (period: DashboardPeriod = 'week') =>
  useQuery({
    queryKey: ['admin', 'team-analysis', period],
    queryFn: () =>
      api
        .get<{ data: TeamAnalysisData; meta: DashboardDateMeta }>('/admin/team-analysis', {
          params: { period },
        })
        .then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
