import type { QueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from '@/lib/constants';
import type { Message, Notification } from '@/types';
import { useChatStore } from '@/store/useChatStore';

const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const setupSocketEventHandlers = (
  socket: { on: (event: string, handler: (...args: unknown[]) => void) => void },
  queryClient: QueryClient,
): void => {
  socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
  });

  socket.on(SOCKET_EVENTS.SHIFT_UPDATED, () => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  });

  socket.on(SOCKET_EVENTS.USER_ONLINE, (data: any) => {
    queryClient.setQueriesData<any[]>({ queryKey: ['users'] }, (oldUsers) => {
      if (!oldUsers) return oldUsers;
      return oldUsers.map((u) => (u._id === data.userId ? { ...u, isOnline: data.online } : u));
    });
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
    // Use setQueriesData to fuzzy match the queryKey (since it includes params)
    queryClient.setQueriesData<Message[]>({ queryKey: ['messages', message.conversationId] }, (old) => {
      if (!old) return [message];
      // Prevent duplicates
      if (old.some(m => m._id === message._id)) return old;
      return [...old, message];
    });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  });

  socket.on(SOCKET_EVENTS.CHAT_TYPING, (data: unknown) => {
    const { userId, conversationId } = data as { userId: string; conversationId: string };
    const store = useChatStore.getState();
    store.addTypingUser(conversationId, userId);

    const timeoutKey = `${conversationId}:${userId}`;
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey)!);
    }

    const timeoutId = setTimeout(() => {
      useChatStore.getState().removeTypingUser(conversationId, userId);
      typingTimeouts.delete(timeoutKey);
    }, 3000);

    typingTimeouts.set(timeoutKey, timeoutId);
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
