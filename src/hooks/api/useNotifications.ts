import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Notification } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

export interface NotificationMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  unreadCount?: number;
}

export interface NotificationsResponse {
  success?: boolean;
  data: Notification[];
  meta?: NotificationMeta;
}

const notificationApi = {
  getNotifications: (params: Record<string, string | number> = {}) =>
    api.get<NotificationsResponse>('/notifications', { params }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  updatePreferences: (data: Record<string, boolean>) =>
    api.put('/notifications/preferences', data),
  getUnreadCount: () => api.get<{ data: { count: number } }>('/notifications/unread-count'),
};

export const useInfiniteNotifications = (limit = 30) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useInfiniteQuery({
    queryKey: ['notifications', organizationId, { limit }],
    queryFn: ({ pageParam = 1 }) =>
      notificationApi.getNotifications({ page: pageParam, limit }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.meta?.hasMore) {
        return (lastPage.meta.page ?? 1) + 1;
      }
      return undefined;
    },
    refetchInterval: 30000,
  });
};

export const useNotifications = (params: Record<string, string | number> = {}) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['notifications', organizationId, params],
    queryFn: () => notificationApi.getNotifications(params).then((r) => r.data.data),
    refetchInterval: 30000,
  });
};

export const useUnreadCount = () => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['unreadCount', organizationId],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data.data.count),
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);

      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((n: Notification) => (n._id === id ? { ...n, isRead: true } : n));
        }
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: NotificationsResponse) => ({
              ...page,
              data: page.data?.map((n: Notification) => (n._id === id ? { ...n, isRead: true } : n)) || [],
            })),
          };
        }
        return old;
      });

      // Update unread count
      queryClient.setQueriesData<number>({ queryKey: ['unreadCount'] }, (old) => {
        if (typeof old !== 'number') return old;
        return Math.max(0, old - 1);
      });

      return { previousNotifications };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueriesData({ queryKey: ['notifications'] }, context.previousNotifications);
      }
    },
    onSettled: () => {
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
