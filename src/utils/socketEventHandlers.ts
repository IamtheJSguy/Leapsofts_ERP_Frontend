import type { QueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from '@/lib/constants';
import type { Conversation, Message, Notification } from '@/types';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';

const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const getSenderId = (message: Message): string => {
  if (message.senderId) {
    return typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
  }
  if (message.sender) {
    return typeof message.sender === 'string' ? message.sender : message.sender._id;
  }
  return '';
};

const getConversationId = (message: Message): string => {
  const id = message.conversationId as unknown;
  if (typeof id === 'object' && id !== null && '_id' in (id as object)) {
    return String((id as { _id: string })._id);
  }
  return String(message.conversationId);
};

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

  socket.on(SOCKET_EVENTS.USER_ONLINE, (data: unknown) => {
    const payload = data as { userId: string; online: boolean };
    queryClient.setQueriesData<any[]>({ queryKey: ['users'] }, (oldUsers) => {
      if (!oldUsers) return oldUsers;
      return oldUsers.map((u) => (u._id === payload.userId ? { ...u, isOnline: payload.online } : u));
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
    const conversationId = getConversationId(message);
    const currentUserId = useAuthStore.getState().user?._id;
    const senderId = getSenderId(message);
    const chatStore = useChatStore.getState();

    queryClient.setQueriesData<Message[]>({ queryKey: ['messages', conversationId] }, (old) => {
      if (!old) return [message];
      if (old.some((m) => m._id === message._id)) return old;
      return [...old, message];
    });

    queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
      if (!old) return old;
      const updated = old.map((conv) => {
        if (conv._id !== conversationId) return conv;
        const isActive = chatStore.activeConversationId === conversationId;
        const isOwn = senderId === currentUserId;
        return {
          ...conv,
          lastMessage: message,
          updatedAt: message.createdAt || conv.updatedAt,
          unreadCount: isActive || isOwn ? 0 : (conv.unreadCount || 0) + 1,
        };
      });
      // Move conversation to top
      const idx = updated.findIndex((c) => c._id === conversationId);
      if (idx > 0) {
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
      }
      return updated;
    });

    if (
      conversationId &&
      senderId !== currentUserId &&
      chatStore.activeConversationId !== conversationId
    ) {
      chatStore.incrementUnread(conversationId);
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE_READ, (data: unknown) => {
    const { conversationId, userId } = data as { conversationId: string; userId: string };
    const currentUserId = useAuthStore.getState().user?._id;

    if (userId === currentUserId) {
      useChatStore.getState().clearUnread(conversationId);
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
        if (!old) return old;
        return old.map((conv) =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv,
        );
      });
    }
  });

  socket.on(SOCKET_EVENTS.CONVERSATION_NEW, (data: unknown) => {
    const conversation = data as Conversation;
    queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
      if (!old) return [conversation];
      if (old.some((c) => c._id === conversation._id)) {
        return old.map((c) => (c._id === conversation._id ? { ...c, ...conversation } : c));
      }
      return [conversation, ...old];
    });
  });

  socket.on(SOCKET_EVENTS.CONVERSATION_UPDATED, (data: unknown) => {
    const payload = data as Conversation & { removed?: boolean; participantId?: string };
    const currentUserId = useAuthStore.getState().user?._id;

    if (payload.removed && payload.participantId === currentUserId) {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) =>
        old ? old.filter((c) => c._id !== payload._id) : old,
      );
      if (useChatStore.getState().activeConversationId === payload._id) {
        useChatStore.getState().setActiveConversation(null);
      }
      return;
    }

    queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
      if (!old) return old;
      const exists = old.some((c) => c._id === payload._id);
      if (!exists) return [payload, ...old];
      return old.map((c) => (c._id === payload._id ? { ...c, ...payload } : c));
    });
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
