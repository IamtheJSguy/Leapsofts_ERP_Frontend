import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import { setupSocketEventHandlers } from '@/utils/socketEventHandlers';
import { SOCKET_EVENTS } from '@/lib/constants';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

let eventHandlersInitialized = false;

export const useSocket = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      eventHandlersInitialized = false;
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
          queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] });
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });

      eventHandlersInitialized = true;
    }
  }, [isAuthenticated]);

  const joinChat = useCallback((conversationId: string) => {
    getSocket().emit(SOCKET_EVENTS.CHAT_JOIN, conversationId);
  }, []);

  const leaveChat = useCallback((conversationId: string) => {
    getSocket().emit(SOCKET_EVENTS.CHAT_LEAVE, conversationId);
  }, []);

  const emitTyping = useCallback((conversationId: string) => {
    getSocket().emit(SOCKET_EVENTS.CHAT_TYPING, { conversationId });
  }, []);

  const joinRoom = useCallback((room: string) => {
    getSocket().emit(SOCKET_EVENTS.JOIN_ROOM, { room });
  }, []);

  const leaveRoom = useCallback((room: string) => {
    getSocket().emit(SOCKET_EVENTS.LEAVE_ROOM, { room });
  }, []);

  return { joinRoom, leaveRoom, joinChat, leaveChat, emitTyping, socket: getSocket() };
};
