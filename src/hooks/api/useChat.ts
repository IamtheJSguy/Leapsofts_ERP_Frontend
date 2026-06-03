import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Conversation, Message } from '@/types';

const chatApi = {
  getConversations: () => api.get<{ data: Conversation[] }>('/chat/conversations'),
  getMessages: (conversationId: string, params: Record<string, string>) =>
    api.get<{ data: Message[] }>(`/chat/messages/${conversationId}`, { params }),
  sendMessage: (data: {
    conversationId: string;
    content: string;
    type?: string;
    fileUrl?: string;
    driveFileId?: string;
  }) => api.post('/chat/messages', data),
  createConversation: (data: { participantIds: string[] }) =>
    api.post('/chat/conversations', data),
  searchMessages: (query: string) =>
    api.get('/chat/search', { params: { q: query } }),
};

export const useConversations = () =>
  useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations().then((r) => r.data.data),
  });

export const useMessages = (conversationId: string | null, params: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () => chatApi.getMessages(conversationId!, params).then((r) => r.data.data),
    enabled: !!conversationId,
  });

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
};

export const useSearchMessages = (query: string) =>
  useQuery({
    queryKey: ['messageSearch', query],
    queryFn: () => chatApi.searchMessages(query).then((r) => r.data.data),
    enabled: query.length > 2,
  });
