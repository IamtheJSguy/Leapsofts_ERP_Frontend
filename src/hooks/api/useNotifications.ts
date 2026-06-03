import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Notification } from '@/types';

const notificationApi = {
  getNotifications: (params: Record<string, string>) =>
    api.get<{ data: Notification[] }>('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  updatePreferences: (data: Record<string, boolean>) =>
    api.put('/notifications/preferences', data),
  getUnreadCount: () => api.get<{ data: { count: number } }>('/notifications/unread-count'),
};

export const useNotifications = (params: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationApi.getNotifications(params).then((r) => r.data.data),
    refetchInterval: 30000,
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data.data.count),
    refetchInterval: 30000,
  });

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.updatePreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
