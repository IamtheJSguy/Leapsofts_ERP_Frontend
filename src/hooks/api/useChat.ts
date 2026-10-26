import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, type QueryClient } from '@tanstack/react-query';
import axios, { type AxiosResponse } from 'axios';
import api from '@/lib/axios';
import { getSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/lib/constants';
import { closeRemovedConversation } from '@/utils/closeRemovedConversation';
import type { Conversation, Message, MessageReaction, PresenceStatus, User } from '@/types';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { normalizeIdList, normalizeMessageReceipts, serializeReceiptMap, toReplySnippet } from '@/utils/chatMessageUtils';
import {
  appendMessageToCache,
  findMessageInCache,
  flattenMessagePages,
  mapMessageCache,
  messagesQueryKey,
  MESSAGES_STALE_TIME_MS,
  type MessagesInfiniteData,
  type MessagesPage,
} from '@/utils/chatMessageCache';
import { fetchMessagesPage } from '@/utils/fetchMessagesPage';
import { warmConversationMessagesCache } from '@/utils/warmConversationMessages';

export { fetchMessagesPage } from '@/utils/fetchMessagesPage';

const chatApi = {
  getConversations: () => api.get<{ data: Conversation[] }>('/chat/conversations'),
  sendMessage: (data: {
    conversationId: string;
    content: string;
    type?: string;
    clientMessageId?: string;
    fileUrl?: string;
    driveFileId?: string;
    driveFileName?: string;
    driveMimeType?: string;
    driveWebViewLink?: string;
    driveIconLink?: string;
    driveThumbnailLink?: string;
    replyTo?: string;
  }): Promise<{ data: { data: Message } }> => {
    const clientMessageId =
      data.clientMessageId || `cmsg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const payload = { ...data, clientMessageId };

    const socket = getSocket();
    if (socket.connected) {
      return new Promise<{ data: { data: Message } }>((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          // Fallback to HTTP POST on 3s timeout (guaranteed delivery)
          api
            .post<{ data: Message }>(`/chat/conversations/${data.conversationId}/messages`, payload)
            .then(resolve)
            .catch((err) => {
              throw err;
            });
        }, 3000);

        socket.emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          payload,
          (response?: { success: boolean; data?: Message; error?: string }) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (response?.success && response.data) {
              resolve({ data: { data: response.data } });
            } else {
              // Socket error or rejected; fallback to HTTP POST
              api
                .post<{ data: Message }>(`/chat/conversations/${data.conversationId}/messages`, payload)
                .then(resolve);
            }
          },
        );
      });
    }

    // Socket not connected; send via HTTP POST directly
    return api.post<{ data: Message }>(`/chat/conversations/${data.conversationId}/messages`, payload);
  },
  sendChatImage: (data: {
    conversationId: string;
    file: File;
    content?: string;
    replyTo?: string;
  }) => {
    const formData = new FormData();
    formData.append('image', data.file);
    if (data.content) formData.append('content', data.content);
    if (data.replyTo) formData.append('replyTo', data.replyTo);
    return api.post(`/chat/conversations/${data.conversationId}/messages/image`, formData, {
      headers: { 'Content-Type': undefined as unknown as string },
    });
  },
  setMessageReaction: (data: { conversationId: string; messageId: string; emoji: string }) =>
    api.put<{ data: Message }>(
      `/chat/conversations/${data.conversationId}/messages/${data.messageId}/reaction`,
      { emoji: data.emoji },
    ),
  markRead: (conversationId: string) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.CHAT_READ, { conversationId });
      return Promise.resolve({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as AxiosResponse<{ success: boolean }>);
    }
    return api.post(`/chat/conversations/${conversationId}/read`);
  },
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
  createBoardConversation: (boardId: string) =>
    api.post<{ data: Conversation }>('/chat/conversations/board', { boardId }),
  getBoardConversation: (boardId: string) =>
    api.get<{ data: Conversation }>(`/chat/conversations/board/${boardId}`),
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
  queryClient.setQueriesData<Message[] | MessagesInfiniteData>(
    { queryKey: ['messages', conversationId] },
    (old) => {
      if (!old) return old;
      let changed = false;
      const next = mapMessageCache(old, (messages) =>
        messages.map((msg) => {
          if (msg._id !== messageId) return msg;
          changed = true;
          return { ...msg, reactions };
        }),
      );
      return changed ? next : old;
    },
  );
};

export const useConversations = (options?: { enabled?: boolean }) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['conversations', organizationId],
    queryFn: () =>
      chatApi.getConversations().then((r) => {
        const data = r.data.data || [];
        return data;
      }),
    // Sockets deliver live updates; reconnects are handled in useSocket.ts.
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};

/** Background-warm latest message pages into the React Query / IndexedDB cache. */
export const warmMessagesForConversations = (
  queryClient: QueryClient,
  conversations: Conversation[],
  organizationId: string | undefined | null,
) =>
  warmConversationMessagesCache(queryClient, conversations, organizationId, (conversationId) =>
    fetchMessagesPage(conversationId),
  );

export const useMessages = (conversationId: string | null) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const query = useInfiniteQuery({
    queryKey: messagesQueryKey(conversationId, organizationId),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }): Promise<MessagesPage> =>
      fetchMessagesPage(conversationId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || lastPage.messages.length === 0) return undefined;
      return lastPage.messages[0]._id;
    },
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    // IDB + sockets keep data current; open chat from cache without a network wait.
    staleTime: MESSAGES_STALE_TIME_MS,
    refetchOnMount: false,
  });

  const messages = useMemo(
    () => flattenMessagePages(query.data as MessagesInfiniteData | undefined),
    [query.data],
  );

  return { ...query, messages };
};

const applySentMessageToCache = (
  queryClient: QueryClient,
  conversationId: string,
  res: AxiosResponse,
) => {
  const message = normalizeMessageReceipts((res.data as { data: Message }).data);
  const currentUserId = useAuthStore.getState().user?._id;
  if (message) {
    queryClient.setQueriesData<Message[] | MessagesInfiniteData>(
      { queryKey: ['messages', conversationId] },
      (old) => appendMessageToCache(old, message, { currentUserId }),
    );
    const messageTime = message.createdAt || new Date().toISOString();
    queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
      if (!old) return old;
      const updated = old.map((conv) =>
        conv._id === conversationId
          ? {
              ...conv,
              lastMessage: message,
              lastMessageAt: messageTime,
              updatedAt: messageTime,
              unreadCount: 0,
            }
          : conv,
      );
      const idx = updated.findIndex((c) => c._id === conversationId);
      if (idx > 0) {
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
      }
      return updated;
    });
  } else {
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }
};

const mergeReceiptTimeMaps = (
  a?: Record<string, unknown> | null,
  b?: Record<string, unknown> | null,
  strategy: 'earliest' | 'latest' = 'earliest',
): Record<string, string> => {
  const mapA = serializeReceiptMap(a);
  const mapB = serializeReceiptMap(b);
  const allKeys = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
  const result: Record<string, string> = {};
  for (const key of allKeys) {
    const valA = mapA[key];
    const valB = mapB[key];
    if (valA && valB) {
      const timeA = new Date(valA).getTime();
      const timeB = new Date(valB).getTime();
      if (!Number.isNaN(timeA) && !Number.isNaN(timeB)) {
        result[key] = strategy === 'earliest'
          ? (timeA <= timeB ? valA : valB)
          : (timeA >= timeB ? valA : valB);
      } else {
        result[key] = valA || valB;
      }
    } else {
      result[key] = (valA || valB)!;
    }
  }
  return result;
};

const mergeMessageReceipts = (target: Message, source?: Message): Message => {
  if (!source) return target;
  const deliveredTo = Array.from(
    new Set([...normalizeIdList(target.deliveredTo), ...normalizeIdList(source.deliveredTo)]),
  );
  const readBy = Array.from(
    new Set([...normalizeIdList(target.readBy), ...normalizeIdList(source.readBy)]),
  );
  const deliveredAt = mergeReceiptTimeMaps(
    source.deliveredAt as Record<string, unknown> | undefined,
    target.deliveredAt as Record<string, unknown> | undefined,
    'earliest',
  );
  const readAt = mergeReceiptTimeMaps(
    source.readAt as Record<string, unknown> | undefined,
    target.readAt as Record<string, unknown> | undefined,
    'latest',
  );
  return {
    ...target,
    deliveredTo,
    readBy,
    deliveredAt,
    readAt,
  };
};

const reconcileSentMessageInCache = (
  old: Message[] | MessagesInfiniteData | undefined,
  realMessage: Message,
  tempId?: string,
) => {
  const currentUserId = useAuthStore.getState().user?._id;
  const existingPending = tempId ? findMessageInCache(old, tempId) : undefined;
  const existingReal = findMessageInCache(old, realMessage._id);
  const mergedWithExisting = mergeMessageReceipts(
    mergeMessageReceipts(realMessage, existingPending),
    existingReal,
  );

  const merged = appendMessageToCache(old, mergedWithExisting, { currentUserId });
  if (!tempId || !merged) return merged;
  return mapMessageCache(merged, (messages) =>
    messages
      .filter((m) => m._id !== tempId)
      .map((m) =>
        m._id === realMessage._id ? { ...m, ...mergedWithExisting, clientId: tempId, isPending: false } : m,
      ),
  );
};

const resolveOptimisticReplyTo = (
  queryClient: QueryClient,
  conversationId: string,
  replyToId?: string,
) => {
  if (!replyToId) return undefined;
  const queries = queryClient.getQueriesData<Message[] | MessagesInfiniteData>({
    queryKey: ['messages', conversationId],
  });
  for (const [, data] of queries) {
    const found = findMessageInCache(data, replyToId);
    if (found) return toReplySnippet(found);
  }
  return undefined;
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendMessage,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['messages', variables.conversationId] });
      const previous = queryClient.getQueriesData<Message[] | MessagesInfiniteData>({
        queryKey: ['messages', variables.conversationId],
      });

      const user = useAuthStore.getState().user;
      const tempId = `cmsg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      (variables as { clientMessageId?: string }).clientMessageId = tempId;
      const replyTo = resolveOptimisticReplyTo(
        queryClient,
        variables.conversationId,
        variables.replyTo,
      );
      const optimisticMessage: Message = {
        _id: tempId,
        clientMessageId: tempId,
        conversationId: variables.conversationId,
        sender: user,
        senderId: user?._id,
        content: variables.content,
        type: variables.type || 'text',
        driveFileId: variables.driveFileId,
        driveFileName: variables.driveFileName,
        driveMimeType: variables.driveMimeType,
        driveWebViewLink: variables.driveWebViewLink,
        driveIconLink: variables.driveIconLink,
        driveThumbnailLink: variables.driveThumbnailLink,
        createdAt: new Date().toISOString(),
        isPending: true,
        reactions: [],
        ...(replyTo ? { replyTo } : {}),
      } as Message;

      queryClient.setQueriesData<Message[] | MessagesInfiniteData>(
        { queryKey: ['messages', variables.conversationId] },
        (old) => appendMessageToCache(old, optimisticMessage),
      );

      // Optimistically update conversation timestamp and move to top immediately
      queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
        if (!old) return old;
        const updated = old.map((conv) =>
          conv._id === variables.conversationId
            ? {
                ...conv,
                lastMessage: optimisticMessage,
                lastMessageAt: optimisticMessage.createdAt,
                updatedAt: optimisticMessage.createdAt,
              }
            : conv,
        );
        const idx = updated.findIndex((c) => c._id === variables.conversationId);
        if (idx > 0) {
          const [item] = updated.splice(idx, 1);
          updated.unshift(item);
        }
        return updated;
      });

      return { previous, tempId };
    },
    onSuccess: (res, variables, context) => {
      const realMessage = normalizeMessageReceipts((res.data as { data: Message }).data);
      if (realMessage) {
        queryClient.setQueriesData<Message[] | MessagesInfiniteData>(
          { queryKey: ['messages', variables.conversationId] },
          (old) => reconcileSentMessageInCache(old, realMessage, context?.tempId),
        );
        const messageTime = realMessage.createdAt || new Date().toISOString();
        queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
          if (!old) return old;
          const updated = old.map((conv) =>
            conv._id === variables.conversationId
              ? {
                  ...conv,
                  lastMessage: realMessage,
                  lastMessageAt: messageTime,
                  updatedAt: messageTime,
                  unreadCount: 0,
                }
              : conv,
          );
          const idx = updated.findIndex((c) => c._id === variables.conversationId);
          if (idx > 0) {
            const [item] = updated.splice(idx, 1);
            updated.unshift(item);
          }
          return updated;
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 403 || status === 404) {
        closeRemovedConversation(variables.conversationId);
      }
    },
  });
};

export const useSendChatImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendChatImage,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['messages', variables.conversationId] });
      const previous = queryClient.getQueriesData<Message[] | MessagesInfiniteData>({
        queryKey: ['messages', variables.conversationId],
      });

      const user = useAuthStore.getState().user;
      const tempId = `optimistic-${Date.now()}`;
      const replyTo = resolveOptimisticReplyTo(
        queryClient,
        variables.conversationId,
        variables.replyTo,
      );
      const optimisticMessage: Message = {
        _id: tempId,
        conversationId: variables.conversationId,
        sender: user,
        senderId: user?._id,
        content: variables.content || '',
        type: 'file',
        fileUrl: URL.createObjectURL(variables.file),
        createdAt: new Date().toISOString(),
        isPending: true,
        reactions: [],
        ...(replyTo ? { replyTo } : {}),
      } as Message;

      queryClient.setQueriesData<Message[] | MessagesInfiniteData>(
        { queryKey: ['messages', variables.conversationId] },
        (old) => appendMessageToCache(old, optimisticMessage),
      );

      // Optimistically update conversation timestamp and move to top immediately
      queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
        if (!old) return old;
        const updated = old.map((conv) =>
          conv._id === variables.conversationId
            ? {
                ...conv,
                lastMessage: optimisticMessage,
                lastMessageAt: optimisticMessage.createdAt,
                updatedAt: optimisticMessage.createdAt,
              }
            : conv,
        );
        const idx = updated.findIndex((c) => c._id === variables.conversationId);
        if (idx > 0) {
          const [item] = updated.splice(idx, 1);
          updated.unshift(item);
        }
        return updated;
      });

      return { previous, tempId };
    },
    onSuccess: (res, variables, context) => {
      const realMessage = normalizeMessageReceipts((res.data as { data: Message }).data);
      if (realMessage) {
        queryClient.setQueriesData<Message[] | MessagesInfiniteData>(
          { queryKey: ['messages', variables.conversationId] },
          (old) => reconcileSentMessageInCache(old, realMessage, context?.tempId),
        );
        const messageTime = realMessage.createdAt || new Date().toISOString();
        queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
          if (!old) return old;
          const updated = old.map((conv) =>
            conv._id === variables.conversationId
              ? {
                  ...conv,
                  lastMessage: realMessage,
                  lastMessageAt: messageTime,
                  updatedAt: messageTime,
                  unreadCount: 0,
                }
              : conv,
          );
          const idx = updated.findIndex((c) => c._id === variables.conversationId);
          if (idx > 0) {
            const [item] = updated.splice(idx, 1);
            updated.unshift(item);
          }
          return updated;
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatApi.markRead(conversationId),
    onSuccess: (_res, conversationId) => {
      queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
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
      const previous = queryClient.getQueriesData<Message[] | MessagesInfiniteData>({
        queryKey: ['messages', conversationId],
      });
      const user = useAuthStore.getState().user;
      const userId = user?._id;
      if (userId) {
        queryClient.setQueriesData<Message[] | MessagesInfiniteData>(
          { queryKey: ['messages', conversationId] },
          (old) =>
            mapMessageCache(old, (messages) =>
              messages.map((msg) => {
                if (msg._id !== messageId) return msg;
                return {
                  ...msg,
                  reactions: applyOptimisticReaction(msg.reactions, userId, emoji, user),
                };
              }),
            ),
        );
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
        queryClient.setQueriesData<Message[] | MessagesInfiniteData>(
          { queryKey: ['messages', variables.conversationId] },
          (old) =>
            mapMessageCache(old, (messages) =>
              messages.map((m) => (m._id === message._id ? { ...m, ...message } : m)),
            ),
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
        queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
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

export const useCreateBoardConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createBoardConversation,
    onSuccess: (res) => {
      const newConversation: Conversation | undefined =
        (res.data as { data?: Conversation })?.data ?? (res.data as unknown as Conversation);
      if (newConversation?._id) {
        queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
          if (!old) {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            return old;
          }
          if (old.some((c) => c._id === newConversation._id)) {
            return old.map((c) =>
              c._id === newConversation._id ? { ...c, ...newConversation } : c,
            );
          }
          return [newConversation, ...old];
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });
};

export const useSearchMessages = (query: string) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['messageSearch', query, organizationId],
    queryFn: () => chatApi.searchMessages(query).then((r) => r.data.data),
    enabled: query.length > 2,
  });
};

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
