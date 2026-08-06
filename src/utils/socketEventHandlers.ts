import type { QueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from '@/lib/constants';
import type { Conversation, Message, Notification, PresenceStatus, User } from '@/types';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { addUserToIdList, normalizeMessageReceipts, serializeReceiptMap } from '@/utils/chatMessageUtils';

const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// The backend emits MESSAGE_NEW to both `conversation:<id>` and `user:<id>`
// rooms. Users who have joined a conversation room receive it twice.
// Track recently processed message IDs and ignore the duplicate delivery.
const recentlyProcessedMessages = new Set<string>();

const notificationSound = new Audio('/faahh.mp3');
notificationSound.preload = 'auto';

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

const patchMessagesReceipt = (
  queryClient: QueryClient,
  conversationId: string,
  messageIds: string[] | undefined,
  userId: string,
  field: 'deliveredTo' | 'readBy',
  at?: string,
) => {
  const timeField = field === 'deliveredTo' ? 'deliveredAt' : 'readAt';
  const atIso = at || new Date().toISOString();
  const userKey = String(userId);

  queryClient.setQueriesData<Message[]>({ queryKey: ['messages', conversationId] }, (old) => {
    if (!old?.length) return old;
    const targetIds = messageIds?.length ? new Set(messageIds) : null;
    let changed = false;
    const next = old.map((msg) => {
      if (targetIds && !targetIds.has(msg._id)) return msg;
      const current = msg[field];
      const alreadyHas = (current || []).some((id) =>
        typeof id === 'string' ? id === userKey : (id as User)?._id === userKey,
      );
      const existingMap = serializeReceiptMap(msg[timeField] as Record<string, unknown> | undefined);
      const existingAt = existingMap[userKey];
      if (alreadyHas && existingAt) return msg;
      changed = true;
      return {
        ...msg,
        [field]: alreadyHas ? current : addUserToIdList(current, userKey),
        [timeField]: {
          ...existingMap,
          [userKey]: existingAt || atIso,
        },
      };
    });
    return changed ? next : old;
  });
};

const applyUserPresence = (
  queryClient: QueryClient,
  userId: string,
  status: PresenceStatus,
  lastSeenAt?: string,
) => {
  useChatStore.getState().setPresence(userId, status, lastSeenAt);
  queryClient.setQueriesData<User[]>({ queryKey: ['users'] }, (oldUsers) => {
    if (!oldUsers) return oldUsers;
    return oldUsers.map((u) =>
      u._id === userId
        ? {
            ...u,
            presenceStatus: status,
            lastSeenAt: lastSeenAt ?? u.lastSeenAt,
            isOnline: status === 'online',
          }
        : u,
    );
  });
};

const systemNotificationSound = new Audio('/amor.mp3');
systemNotificationSound.preload = 'auto';

export const setupSocketEventHandlers = (
  socket: {
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    emit: (event: string, ...args: unknown[]) => void;
  },
  queryClient: QueryClient,
): void => {
  socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    
    try {
      systemNotificationSound.currentTime = 0;
      systemNotificationSound.play().catch(e => console.error("Audio playback failed:", e));
    } catch (e) {
      console.error("Audio not supported");
    }
  });

  socket.on(SOCKET_EVENTS.SHIFT_UPDATED, () => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  });

  socket.on(SOCKET_EVENTS.USER_ONLINE, (data: unknown) => {
    const payload = data as { userId: string; online: boolean };
    const status: PresenceStatus = payload.online ? 'online' : 'offline';
    applyUserPresence(queryClient, payload.userId, status);
  });

  socket.on(SOCKET_EVENTS.USER_PRESENCE, (data: unknown) => {
    const payload = data as { userId: string; status: PresenceStatus; lastSeenAt?: string };
    if (!payload?.userId || !payload.status) return;
    applyUserPresence(queryClient, payload.userId, payload.status, payload.lastSeenAt);
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
    queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
    queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
  });

  socket.on(SOCKET_EVENTS.MESSAGE_NEW, (data: unknown) => {
    const message = normalizeMessageReceipts(data as Message);
    const messageId = message._id;

    // Guard against double-delivery: the backend emits to both the conversation
    // room and each user's personal room. Skip if already handled.
    if (messageId && recentlyProcessedMessages.has(messageId)) return;
    if (messageId) {
      recentlyProcessedMessages.add(messageId);
      setTimeout(() => recentlyProcessedMessages.delete(messageId), 5000);
    }

    const conversationId = getConversationId(message);
    const currentUserId = useAuthStore.getState().user?._id;
    const senderId = getSenderId(message);
    const chatStore = useChatStore.getState();

    // C→S delivery ACK so the sender can advance to double-grey ticks even when
    // we received via `user:<id>` outside the conversation room.
    if (conversationId && senderId && senderId !== currentUserId) {
      socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, { conversationId });
    }

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

      // WhatsApp style notification and audio
      try {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(e => console.error("Audio playback failed:", e));
      } catch (e) {
        console.error("Audio not supported");
      }

      let senderName = 'New Message';
      let senderAvatar = undefined;

      if (typeof message.sender === 'object' && message.sender !== null) {
        const s = message.sender as any;
        if (s.firstName || s.lastName) {
          senderName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
        } else if (s.name) {
          senderName = s.name;
        }
        senderAvatar = s.avatar;
      }

      useUIStore.getState().addToast({
        message: message.content || 'Sent an attachment',
        severity: 'message',
        title: senderName,
        avatar: senderAvatar,
        conversationId
      });
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, (data: unknown) => {
    const { conversationId, userId, messageIds, at } = data as {
      conversationId: string;
      userId: string;
      messageIds?: string[];
      at?: string;
    };
    if (!conversationId || !userId) return;
    patchMessagesReceipt(queryClient, conversationId, messageIds, userId, 'deliveredTo', at);
  });

  socket.on(SOCKET_EVENTS.MESSAGE_READ, (data: unknown) => {
    const { conversationId, userId, messageIds, at } = data as {
      conversationId: string;
      userId: string;
      messageIds?: string[];
      at?: string;
    };
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

    if (conversationId && userId) {
      patchMessagesReceipt(queryClient, conversationId, messageIds, userId, 'readBy', at);
      // Reading implies delivery for that user (preserve earlier deliveredAt if present)
      patchMessagesReceipt(queryClient, conversationId, messageIds, userId, 'deliveredTo', at);
    }
  });

  socket.on(SOCKET_EVENTS.CONVERSATION_NEW, (data: unknown) => {
    const conversation = data as Conversation;
    const existing = queryClient.getQueryData<Conversation[]>(['conversations']);
    if (!existing) {
      // Conversations haven't loaded yet — force a fresh fetch that will
      // include the new conversation returned by the server.
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      return;
    }
    queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
      if (!old) return [conversation];
      if (old.some((c) => c._id === conversation._id)) {
        // Already present — just merge in any updated fields (e.g. populated participants)
        return old.map((c) => (c._id === conversation._id ? { ...c, ...conversation } : c));
      }
      // Prepend so it appears at the top of the list
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
