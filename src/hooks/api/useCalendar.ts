import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';

export const CALENDAR_CONNECTED_EVENT = 'leapsofts-calendar-connected';
const CALENDAR_RETURN_KEY = 'leapsofts-calendar-return';

export const refreshCalendarConnection = () => {
  void queryClient.invalidateQueries({ queryKey: ['calendarStatus'] });
};

export const openCalendarOAuthPopup = (url: string) => {
  localStorage.setItem(CALENDAR_RETURN_KEY, window.location.pathname + window.location.search);
  const popup = window.open(url, 'leapsofts-calendar-oauth', 'width=600,height=700');
  popup?.focus();
  return popup;
};

export const CALENDAR_DEFAULT_RETURN_PATH = '/meetings';

export const consumeCalendarReturnPath = () => {
  const path = localStorage.getItem(CALENDAR_RETURN_KEY) || CALENDAR_DEFAULT_RETURN_PATH;
  localStorage.removeItem(CALENDAR_RETURN_KEY);
  return path.startsWith('/') ? path : CALENDAR_DEFAULT_RETURN_PATH;
};

export type CalendarStatus = {
  connected: boolean;
  lastSyncedAt?: string | null;
  importError?: string | null;
  accountEmail?: string | null;
};

export type CalendarSyncResult = {
  imported: number;
  updated: number;
  cancelled: number;
  skipped: number;
  error?: string;
};

const calendarApi = {
  getAuthUrl: () => api.get<{ data: { url: string } }>('/calendar/auth'),
  getStatus: () => api.get<{ data: CalendarStatus }>('/calendar/status'),
  sync: () => api.post<{ data: CalendarSyncResult }>('/calendar/sync'),
  disconnect: () => api.delete<{ data: { connected: boolean } }>('/calendar/disconnect'),
};

export const useCalendarStatus = () => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['calendarStatus', organizationId],
    queryFn: () => calendarApi.getStatus().then((r) => r.data.data),
  });
};

export const useCalendarAuthUrl = () =>
  useMutation({
    mutationFn: () => calendarApi.getAuthUrl().then((r) => r.data.data.url),
  });

export const useDisconnectCalendar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => calendarApi.disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarStatus'] });
    },
  });
};

export const useSyncCalendar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => calendarApi.sync().then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarStatus'] });
      qc.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
};
