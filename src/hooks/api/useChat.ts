import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import api from '@/lib/axios';
import type { Conversation, Message, MessageReaction, PresenceStatus, User } from '@/types';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { normalizeMessageReceipts } from '@/utils/chatMessageUtils';

const chatApi = {
  getConversations: () => api.get<{ data: Conversation[] }>('/chat/conversations'),
  getMessages: (conversationId: string, params: Record<string, string>) =>
    api.get<{ data: Message[] }>(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (data: {
    conversationId: string;
    content: string;
    type?: string;
    fileUrl?: string;
    driveFileId?: string;
    driveFileName?: string;
    driveMimeType?: string;
    driveWebViewLink?: string;
    driveIconLink?: string;
    replyTo?: string;
  }) => api.post(`/chat/conversations/${data.conversationId}/messages`, data),
  setMessageReaction: (data: { conversationId: string; messageId: string; emoji: string }) =>
    api.put<{ data: Message }>(
      `/chat/conversations/${data.conversationId}/messages/${data.messageId}/reaction`,
      { emoji: data.emoji },
    ),
  markRead: (conversationId: string) =>
    api.post(`/chat/conversations/${conversationId}/read`),
  updatePresence: (status: 'away' | 'offline' | null) =>
    api.patch('/chat/presence', { status }),
  createConversation: async (data: {
    participantId?: string;
    isGroup?: boolean;
    name?: string;
    description?: string;
    participantIds?: string[];
  }): Promise<AxiosResponse> => {
    if (data.isGroup) {
      return api.post('/chat/conversations/group', {
        name: data.name,
        description: data.description,
        participantIds: data.participantIds,
      });
    }
    return api.post('/chat/conversations', { participantId: data.participantId });
  },
  searchMessages: (query: string) =>
    api.get('/chat/search', { params: { q: query } }),
  addGroupMember: (data: { conversationId: string; participantId: string }) =>
    api.post(`/chat/conversations/group/${data.conversationId}/participants`, {
      participantId: data.participantId,
    }),
  removeGroupMember: (data: { conversationId: string; participantId: string }) =>
    api.delete(
      `/chat/conversations/group/${data.conversationId}/participants/${data.participantId}`,
    ),
};

const getReactionUserId = (reaction: MessageReaction): string =>
  typeof reaction.userId === 'string' ? reaction.userId : reaction.userId._id;

/** Apply optimistic one-reaction-per-user toggle locally. */
export const applyOptimisticReaction = (
  reactions: MessageReaction[] | undefined,
  userId: string,
  emoji: string,
  user?: User | null,
): MessageReaction[] => {
  const current = reactions || [];
  const existing = current.find((r) => getReactionUserId(r) === userId);
  if (existing?.emoji === emoji) {
    return current.filter((r) => getReactionUserId(r) !== userId);
  }
  const next: MessageReaction = {
    userId: user || userId,
    emoji,
    createdAt: new Date().toISOString(),
  };
  if (existing) {
    return current.map((r) => (getReactionUserId(r) === userId ? next : r));
  }
  return [...current, next];
};

const patchMessageReactions = (
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  reactions: MessageReaction[],
) => {
  queryClient.setQueriesData<Message[]>({ queryKey: ['messages', conversationId] }, (old) => {
    if (!old) return old;
    let changed = false;
    const next = old.map((msg) => {
      if (msg._id !== messageId) return msg;
      changed = true;
      return { ...msg, reactions };
    });
    return changed ? next : old;
  });
};

export const useConversations = () =>
  useQuery({
    queryKey: ['conversations'],
    queryFn: () =>
      chatApi.getConversations().then((r) => {
        const data = r.data.data || [];
        return data;
      }),
    // Sockets deliver live updates, but this is the fallback if a message
    // was missed while the socket was disconnected (e.g. tab was backgrounded).
    refetchOnWindowFocus: true,
  });

export const useMessages = (conversationId: string | null, params: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () =>
      chatApi.getMessages(conversationId!, params).then((r) => r.data.data.map(normalizeMessageReceipts)),
    enabled: !!conversationId,
    refetchOnWindowFocus: true,
  });

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (res, variables) => {
      const message = normalizeMessageReceipts((res.data as { data: Message }).data);
      if (message) {
        queryClient.setQueriesData<Message[]>(
          { queryKey: ['messages', variables.conversationId] },
          (old) => {
            if (!old) return [message];
            if (old.some((m) => m._id === message._id)) return old;
            return [...old, message];
          },
        );
        queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
          if (!old) return old;
          const updated = old.map((conv) =>
            conv._id === variables.conversationId
              ? { ...conv, lastMessage: message, updatedAt: message.createdAt, unreadCount: 0 }
              : conv,
          );
          const idx = updated.findIndex((c) => c._id === variables.conversationId);
          if (idx > 0) {
            const [item] = updated.splice(idx, 1);
            updated.unshift(item);
          }
          return updated;
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatApi.markRead(conversationId),
    onSuccess: (_res, conversationId) => {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
        if (!old) return old;
        return old.map((conv) =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv,
        );
      });
    },
  });
};

export const useSetMessageReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.setMessageReaction,
    onMutate: async ({ conversationId, messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const previous = queryClient.getQueriesData<Message[]>({ queryKey: ['messages', conversationId] });
      const user = useAuthStore.getState().user;
      const userId = user?._id;
      if (userId) {
        queryClient.setQueriesData<Message[]>({ queryKey: ['messages', conversationId] }, (old) => {
          if (!old) return old;
          return old.map((msg) => {
            if (msg._id !== messageId) return msg;
            return {
              ...msg,
              reactions: applyOptimisticReaction(msg.reactions, userId, emoji, user),
            };
          });
        });
      }
      return { previous };
    },
    onError: (_err, variables, context) => {
      context?.previous?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (res, variables) => {
      const message = normalizeMessageReceipts((res.data as { data: Message }).data);
      if (message?.reactions) {
        patchMessageReactions(
          queryClient,
          variables.conversationId,
          variables.messageId,
          message.reactions,
        );
      } else if (message) {
        queryClient.setQueriesData<Message[]>(
          { queryKey: ['messages', variables.conversationId] },
          (old) => {
            if (!old) return old;
            return old.map((m) => (m._id === message._id ? { ...m, ...message } : m));
          },
        );
      }
    },
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: (res) => {
      // Extract the new conversation from the response
      const newConversation: Conversation | undefined =
        (res.data as { data?: Conversation })?.data ?? (res.data as unknown as Conversation);

      if (newConversation?._id) {
        // Inject directly into the cache so the creator sees it instantly
        // without waiting for a round-trip refetch.
        queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
          if (!old) {
            // Cache not populated yet — let the socket / next render fetch it
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            return old;
          }
          if (old.some((c) => c._id === newConversation._id)) {
            // Already inserted (e.g. by a concurrent socket event) — merge
            return old.map((c) =>
              c._id === newConversation._id ? { ...c, ...newConversation } : c,
            );
          }
          return [newConversation, ...old];
        });
      } else {
        // Fallback if the response shape is unexpected
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });
};

export const useSearchMessages = (query: string) =>
  useQuery({
    queryKey: ['messageSearch', query],
    queryFn: () => chatApi.searchMessages(query).then((r) => r.data.data),
    enabled: query.length > 2,
  });

export const useAddGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.addGroupMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
};

export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.removeGroupMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
};

export const useUpdatePresence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: 'away' | 'offline' | null) => chatApi.updatePresence(status),
    onMutate: async (status) => {
      const userId = useAuthStore.getState().user?._id;
      if (!userId) return;
      const nextStatus: PresenceStatus = status ?? 'online';
      useChatStore.getState().setPresence(userId, nextStatus);
      queryClient.setQueriesData<User[]>({ queryKey: ['users'] }, (oldUsers) => {
        if (!oldUsers) return oldUsers;
        return oldUsers.map((u) =>
          u._id === userId
            ? {
                ...u,
                presenceStatus: nextStatus,
                isOnline: nextStatus === 'online',
              }
            : u,
        );
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
