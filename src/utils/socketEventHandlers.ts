import type { QueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from '@/lib/constants';
import type { Message, Notification } from '@/types';

export const setupSocketEventHandlers = (
  socket: { on: (event: string, handler: (...args: unknown[]) => void) => void },
  queryClient: QueryClient,
): void => {
  socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
  });

  socket.on(SOCKET_EVENTS.KANBAN_CARD_MOVED, () => {
    queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
  });

  socket.on(SOCKET_EVENTS.KANBAN_COMMENT_ADDED, () => {
    queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
  });

  socket.on(SOCKET_EVENTS.LEAD_STATUS_CHANGED, () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  });

  socket.on(SOCKET_EVENTS.MESSAGE_NEW, (data: unknown) => {
    const message = data as Message;
    queryClient.setQueryData<Message[]>(
      ['messages', message.conversationId],
      (old) => (old ? [...old, message] : [message]),
    );
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  });
};

export const appendNotification = (
  queryClient: QueryClient,
  notification: Notification,
): void => {
  queryClient.setQueryData<Notification[]>(['notifications', {}], (old) =>
    old ? [notification, ...old] : [notification],
  );
  queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
};
