import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { hasPeriodStarted } from '@/lib/salesKpi';
import type { Shift, PipelineMetric, ActivitySample } from '@/types';

export interface DailyKPIEntry {
  _id: string;
  userId: string;
  kpiId?: { _id: string; name: string; description?: string; targetValue?: number; priority?: string };
  assignmentId?: any;
  assignmentItemId?: string;
  kanbanCardId?: { _id: string; title: string; description?: string; dueDate?: string; kpiEndDate?: string; boardId?: string };
  kpiName?: string;
  name?: string;
  description?: string;
  /** Optional quantity target. Absent for simple done/not-done task-style entries. */
  targetValue?: number;
  priority?: string;
  /** Optional live pipeline metric this entry auto-tracks against. */
  pipelineMetric?: PipelineMetric;
  /** Live-computed value for pipeline-linked entries, merged in on read (does not replace stored actualValue). */
  livePipelineValue?: number;
  /** Due date for this entry (optional — may be open-ended). Prefer periodEnd when present. */
  date?: string;
  /** Start of the scheduled period (recurring day/time KPIs). */
  periodStart?: string;
  /** End of the scheduled period — includes endTime when set. Prefer over date for display. */
  periodEnd?: string;
  isCompleted: boolean;
  completedAt?: string;
  actualValue?: number | null;
  notes?: string;
}

export interface GroupedDailyKpis {
  active: DailyKPIEntry[];
  overdue: DailyKPIEntry[];
  done: DailyKPIEntry[];
  highPriority: DailyKPIEntry[];
  counts: {
    active: number;
    overdue: number;
    done: number;
    highPriority: number;
  };
}

export interface DailyKpiSummary {
  total: number;
  completed: number;
  pending: number;
  totalTarget?: number;
  totalActual?: number;
  attainmentRate?: number;
  date: string;
  counts?: GroupedDailyKpis['counts'];
}

export const shiftApi = {
  checkIn: () => api.post<{ success: boolean; data: Shift }>('/shifts/check-in'),
  checkOut: () => api.post<{ success: boolean; data: Shift }>('/shifts/check-out'),
  startBreak: () => api.post<{ success: boolean; data: Shift }>('/shifts/break/start'),
  endBreak: () => api.post<{ success: boolean; data: Shift }>('/shifts/break/end'),
  getToday: () => api.get<{ success: boolean; data: Shift }>('/shifts/today'),
  getHistory: (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { shifts: Shift[]; total: number; page: number; limit: number } }>('/shifts/history', { params }),
  getTeamHistory: (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { shifts: Shift[]; total: number; page: number; limit: number } }>('/shifts/team-history', { params }),
  getActivitySamples: (shiftId: string) =>
    api.get<{ success: boolean; data: ActivitySample[] }>(`/shifts/${shiftId}/activity-samples`),
  getTeamStatus: () =>
    api.get<{
      success: boolean;
      data: {
        totalUsers: number;
        checkedIn: number;
        checkedOut: number;
        onlineMembers: any[];
        punctualityRate: number;
        totalMinutesWorkedToday: number;
        todayShifts: Array<{
          userId: string;
          checkInTime: string | null;
          checkOutTime: string | null;
          totalMinutes: number;
          totalBreakMinutes: number;
          status: Shift['status'];
          scheduledStart?: string;
          scheduledEnd?: string;
        }>;
      };
    }>('/shifts/team-status'),
  
  // Daily KPIs
  getDailyKpis: (params?: { date?: string }) => api.get<{ success: boolean; data: GroupedDailyKpis }>('/shifts/daily-kpis', { params }),
  getDailyKpiSummary: (params?: { date?: string }) => api.get<{ success: boolean; data: DailyKpiSummary }>('/shifts/daily-kpis/summary', { params }),
  markDailyKpiComplete: (id: string, payload?: { notes?: string; actualValue?: number }) =>
    api.patch<{ success: boolean; data: DailyKPIEntry }>(`/shifts/daily-kpis/${id}/complete`, payload ?? {}),
  markDailyKpiIncomplete: (id: string) => api.patch<{ success: boolean; data: DailyKPIEntry }>(`/shifts/daily-kpis/${id}/incomplete`),
};

export const useTodayShift = () =>
  useQuery({
    queryKey: ['shifts', 'today'],
    queryFn: () => shiftApi.getToday().then((r) => r.data.data),
  });

export const useShiftHistory = (params?: { startDate?: string; endDate?: string; page?: number; limit?: number; userId?: string }) =>
  useQuery({
    queryKey: ['shifts', 'history', params],
    queryFn: () => shiftApi.getHistory(params).then((r) => r.data.data),
  });

export const useTeamShiftHistory = (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['shifts', 'teamHistory', params],
    queryFn: () => shiftApi.getTeamHistory(params).then((r) => r.data.data),
  });

export const useShiftActivitySamples = (shiftId: string | undefined) =>
  useQuery({
    queryKey: ['shifts', 'activitySamples', shiftId],
    queryFn: () => shiftApi.getActivitySamples(shiftId as string).then((r) => r.data.data),
    enabled: Boolean(shiftId),
  });

export const useTeamAttendanceSummary = () =>
  useQuery({
    queryKey: ['shifts', 'teamStatus'],
    queryFn: () => shiftApi.getTeamStatus().then((r) => r.data.data),
  });

export const useCheckIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.checkIn,
    onSuccess: (response) => {
      queryClient.setQueryData(['shifts', 'today'], response.data.data);
      queryClient.invalidateQueries({ queryKey: ['shifts', 'history'] });
    },
  });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.checkOut,
    onSuccess: (response) => {
      queryClient.setQueryData(['shifts', 'today'], response.data.data);
      queryClient.invalidateQueries({ queryKey: ['shifts', 'history'] });
    },
  });
};

export const useStartBreak = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.startBreak,
    onSuccess: (response) => {
      queryClient.setQueryData(['shifts', 'today'], response.data.data);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useEndBreak = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shiftApi.endBreak,
    onSuccess: (response) => {
      queryClient.setQueryData(['shifts', 'today'], response.data.data);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

// ─── Daily KPI Hooks ──────────────────────────────────────────────

const filterStartedDailyKpis = (grouped: GroupedDailyKpis, now = new Date()): GroupedDailyKpis => {
  const filter = (entries: DailyKPIEntry[]) =>
    entries.filter((entry) => hasPeriodStarted(entry.periodStart, now));
  const active = filter(grouped.active);
  const overdue = filter(grouped.overdue);
  const done = filter(grouped.done);
  const highPriority = filter(grouped.highPriority);
  return {
    active,
    overdue,
    done,
    highPriority,
    counts: {
      active: active.length,
      overdue: overdue.length,
      done: done.length,
      highPriority: highPriority.length,
    },
  };
};

export const useDailyKpis = (date?: string) => {
  return useQuery({
    queryKey: ['dailyKpis', date],
    queryFn: () =>
      shiftApi
        .getDailyKpis(date ? { date } : undefined)
        .then((r) => filterStartedDailyKpis(r.data.data)),
  });
};

export const useDailyKpiSummary = (date?: string) => {
  return useQuery({
    queryKey: ['dailyKpiSummary', date],
    queryFn: () => shiftApi.getDailyKpiSummary(date ? { date } : undefined).then((r) => r.data.data),
  });
};

export const useMarkDailyKpiComplete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes, actualValue }: { id: string; notes?: string; actualValue?: number }) =>
      shiftApi.markDailyKpiComplete(id, { notes, actualValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyKpis'] });
      queryClient.invalidateQueries({ queryKey: ['dailyKpiSummary'] });
      // Completing a kanban-linked task moves the card into a done column.
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoardCards'] });
    },
  });
};

export const useMarkDailyKpiIncomplete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shiftApi.markDailyKpiIncomplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyKpis'] });
      queryClient.invalidateQueries({ queryKey: ['dailyKpiSummary'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoardCards'] });
    },
  });
};
