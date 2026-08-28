import { queryClient } from '@/lib/queryClient';
import { getSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/lib/constants';
import { router } from '@/router';
import { useChatStore } from '@/store/useChatStore';
import type { Conversation } from '@/types';

/** Drop a conversation the current user can no longer access (removed from group, 403/404). */
export const closeRemovedConversation = (conversationId: string) => {
  if (!conversationId || conversationId.startsWith('mock-')) return;

  queryClient.setQueryData<Conversation[]>(['conversations'], (old) =>
    old ? old.filter((c) => c._id !== conversationId) : old,
  );
  queryClient.removeQueries({ queryKey: ['messages', conversationId] });

  const socket = getSocket();
  if (socket.connected) {
    socket.emit(SOCKET_EVENTS.CHAT_LEAVE, conversationId);
  }

  if (useChatStore.getState().activeConversationId === conversationId) {
    useChatStore.getState().setActiveConversation(null);
  }

  const path = window.location.pathname;
  if (path === `/chat/${conversationId}`) {
    void router.navigate('/chat', { replace: true });
  }
};
