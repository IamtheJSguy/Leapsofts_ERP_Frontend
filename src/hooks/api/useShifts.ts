import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Shift } from '@/types';

export interface DailyKPIEntry {
  _id: string;
  userId: string;
  kpiId?: { _id: string; name: string; description?: string; targetValue: number; timeFrame: string };
  assignmentId?: any;
  assignmentItemId?: string;
  name: string;
  description?: string;
  targetValue: number;
  date: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

export interface DailyKpiSummary {
  total: number;
  completed: number;
  pending: number;
  date: string;
}

export const shiftApi = {
  checkIn: () => api.post<{ success: boolean; data: Shift }>('/shifts/check-in'),
  checkOut: () => api.post<{ success: boolean; data: Shift }>('/shifts/check-out'),
  getToday: () => api.get<{ success: boolean; data: Shift }>('/shifts/today'),
  getHistory: (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { shifts: Shift[]; total: number; page: number; limit: number } }>('/shifts/history', { params }),
  
  // Daily KPIs
  getDailyKpis: (params?: { date?: string }) => api.get<{ success: boolean; data: DailyKPIEntry[] }>('/shifts/daily-kpis', { params }),
  getDailyKpiSummary: (params?: { date?: string }) => api.get<{ success: boolean; data: DailyKpiSummary }>('/shifts/daily-kpis/summary', { params }),
  markDailyKpiComplete: (id: string, notes?: string) => api.patch<{ success: boolean; data: DailyKPIEntry }>(`/shifts/daily-kpis/${id}/complete`, { notes }),
  markDailyKpiIncomplete: (id: string) => api.patch<{ success: boolean; data: DailyKPIEntry }>(`/shifts/daily-kpis/${id}/incomplete`),
};

export const useTodayShift = () =>
  useQuery({
    queryKey: ['shifts', 'today'],
    queryFn: () => shiftApi.getToday().then((r) => r.data.data),
  });

export const useShiftHistory = (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ['shifts', 'history', params],
    queryFn: () => shiftApi.getHistory(params).then((r) => r.data.data),
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

// ─── Daily KPI Hooks ──────────────────────────────────────────────

export const useDailyKpis = (date?: string) => {
  return useQuery({
    queryKey: ['dailyKpis', date],
    queryFn: () => shiftApi.getDailyKpis(date ? { date } : undefined).then((r) => r.data.data),
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
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => shiftApi.markDailyKpiComplete(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyKpis'] });
      queryClient.invalidateQueries({ queryKey: ['dailyKpiSummary'] });
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
    },
  });
};
