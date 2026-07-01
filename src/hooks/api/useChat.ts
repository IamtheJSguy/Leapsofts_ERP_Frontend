import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Conversation, Message } from '@/types';

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
  }) => api.post(`/chat/conversations/${data.conversationId}/messages`, data),
  createConversation: (data: { participantId?: string; isGroup?: boolean; name?: string; description?: string; participantIds?: string[] }) => {
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
    api.post(`/chat/conversations/group/${data.conversationId}/participants`, { participantId: data.participantId }),
  removeGroupMember: (data: { conversationId: string; participantId: string }) =>
    api.delete(`/chat/conversations/group/${data.conversationId}/participants/${data.participantId}`),
};


export const useConversations = () =>
  useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations().then((r) => {
      const data = r.data.data || [];
      return data;
    }),
    refetchInterval: 3000,
  });

export const useMessages = (conversationId: string | null, params: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () => chatApi.getMessages(conversationId!, params).then((r) => r.data.data),
    enabled: !!conversationId,
    refetchInterval: 3000,
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
