import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import { setupSocketEventHandlers } from '@/utils/socketEventHandlers';
import { SOCKET_EVENTS } from '@/lib/constants';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

let eventHandlersInitialized = false;
const ACTIVITY_THROTTLE_MS = 45_000;

export const useSocket = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastActivityEmit = useRef(0);

  const emitPresenceActivity = useCallback(() => {
    if (!useAuthStore.getState().isAuthenticated) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (now - lastActivityEmit.current < ACTIVITY_THROTTLE_MS) return;
    lastActivityEmit.current = now;
    const socket = getSocket();
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.PRESENCE_ACTIVITY);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      eventHandlersInitialized = false;
      useChatStore.getState().resetUnreadCounts();
      return;
    }

    const socket = connectSocket();
    if (!eventHandlersInitialized) {
      setupSocketEventHandlers(socket, queryClient);

      // Any reconnect (network blip, server restart, brief auth hiccup, etc.)
      // starts a fresh socket.io session server-side, so room membership for
      // the active conversation must be re-established. We also resync the
      // conversation list + open thread in case anything was pushed while
      // disconnected, since we no longer poll.
      socket.on('connect', () => {
        const { activeConversationId } = useChatStore.getState();
        if (activeConversationId && !activeConversationId.startsWith('mock-')) {
          socket.emit(SOCKET_EVENTS.CHAT_JOIN, activeConversationId);
          socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, { conversationId: activeConversationId });
          queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] });
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        lastActivityEmit.current = 0;
        socket.emit(SOCKET_EVENTS.PRESENCE_ACTIVITY);
      });

      eventHandlersInitialized = true;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastActivityEmit.current = 0;
        emitPresenceActivity();
      }
    };

    const onUserActivity = () => {
      emitPresenceActivity();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('mousemove', onUserActivity, { passive: true });
    window.addEventListener('keydown', onUserActivity, { passive: true });
    window.addEventListener('click', onUserActivity, { passive: true });
    window.addEventListener('scroll', onUserActivity, { passive: true });
    emitPresenceActivity();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', onUserActivity);
      window.removeEventListener('keydown', onUserActivity);
      window.removeEventListener('click', onUserActivity);
      window.removeEventListener('scroll', onUserActivity);
    };
  }, [isAuthenticated, emitPresenceActivity]);

  const joinChat = useCallback((conversationId: string) => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.CHAT_JOIN, conversationId);
    // Explicit delivery ACK for undelivered messages in this conversation
    // (server also marks on chat:join; this covers multi-instance races).
    socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, { conversationId });
  }, []);

  const leaveChat = useCallback((conversationId: string) => {
    getSocket().emit(SOCKET_EVENTS.CHAT_LEAVE, conversationId);
  }, []);

  const emitTyping = useCallback((conversationId: string) => {
    getSocket().emit(SOCKET_EVENTS.CHAT_TYPING, { conversationId });
  }, []);

  const subscribePresence = useCallback((userIds: string[]) => {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    if (!unique.length) return;
    getSocket().emit(SOCKET_EVENTS.PRESENCE_SUBSCRIBE, unique);
  }, []);

  const joinRoom = useCallback((room: string) => {
    getSocket().emit(SOCKET_EVENTS.JOIN_ROOM, { room });
  }, []);

  const leaveRoom = useCallback((room: string) => {
    getSocket().emit(SOCKET_EVENTS.LEAVE_ROOM, { room });
  }, []);

  return {
    joinRoom,
    leaveRoom,
    joinChat,
    leaveChat,
    emitTyping,
    subscribePresence,
    emitPresenceActivity,
    socket: getSocket(),
  };
};
