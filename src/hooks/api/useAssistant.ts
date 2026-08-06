import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type {
  AiProviderKeysStatus,
  ApiResponse,
  AssistantChatResponse,
  AssistantConversation,
  AssistantConversationDetail,
  AssistantMessage,
  UpdateAiProviderKeysPayload,
} from '@/types';

const assistantApi = {
  getAiKeys: () => api.get<ApiResponse<AiProviderKeysStatus>>('/users/me/ai-keys'),
  updateAiKeys: (data: UpdateAiProviderKeysPayload) =>
    api.put<ApiResponse<AiProviderKeysStatus>>('/users/me/ai-keys', data),
  chat: (data: { conversationId?: string; message: string }) =>
    api.post<ApiResponse<AssistantChatResponse>>('/assistant/chat', data),
  getConversations: () =>
    api.get<ApiResponse<AssistantConversation[]>>('/assistant/conversations'),
  getConversation: (id: string) =>
    api.get<ApiResponse<AssistantConversationDetail | AssistantMessage[]>>(
      `/assistant/conversations/${id}`,
    ),
  deleteConversation: (id: string) => api.delete(`/assistant/conversations/${id}`),
};

function normalizeConversationDetail(
  id: string,
  payload: AssistantConversationDetail | AssistantMessage[],
): AssistantConversationDetail {
  if (Array.isArray(payload)) {
    return {
      conversation: {
        _id: id,
        userId: '',
        title: 'Conversation',
        createdAt: payload[0]?.createdAt ?? new Date().toISOString(),
        updatedAt: payload[payload.length - 1]?.createdAt ?? new Date().toISOString(),
      },
      messages: payload,
    };
  }
  return payload;
}

export const useAiProviderKeys = () =>
  useQuery({
    queryKey: ['aiKeys'],
    queryFn: () => assistantApi.getAiKeys().then((r) => r.data.data),
  });

export const useUpdateAiProviderKeys = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAiProviderKeysPayload) =>
      assistantApi.updateAiKeys(data).then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['aiKeys'], data);
    },
  });
};

export const useAssistantConversations = () =>
  useQuery({
    queryKey: ['assistantConversations'],
    queryFn: () => assistantApi.getConversations().then((r) => r.data.data || []),
  });

export const useAssistantConversation = (id: string | null) =>
  useQuery({
    queryKey: ['assistantConversation', id],
    queryFn: () =>
      assistantApi.getConversation(id!).then((r) =>
        normalizeConversationDetail(id!, r.data.data),
      ),
    enabled: !!id,
  });

export const useAssistantChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { conversationId?: string; message: string }) =>
      assistantApi.chat(data).then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assistantConversations'] });
      if (data.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['assistantConversation', data.conversationId],
        });
      }
    },
  });
};

export const useDeleteAssistantConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assistantApi.deleteConversation(id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: ['assistantConversations'] });
      queryClient.removeQueries({ queryKey: ['assistantConversation', id] });
    },
  });
};
