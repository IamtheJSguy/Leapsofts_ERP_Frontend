import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { ApiResponse } from '@/types';

export type AiProviderType = 'gemini' | 'claude';

export interface AiQuotaSummary {
  preferredProvider: AiProviderType;
  defaultProvider: AiProviderType;
  enrichmentEnabled: boolean;
  tokensUsed: number;
  totalByokTokensUsed: number;
  effectiveTokenLimit: number;
  tokenLimitOverride: number | null;
  remainingTokens: number;
  hasGeminiKey: boolean;
  geminiApiKeyHint: string | null;
  hasClaudeKey: boolean;
  claudeApiKeyHint: string | null;
  hasSystemGeminiKey: boolean;
  hasSystemClaudeKey: boolean;
}

export interface AiCitationSource {
  title?: string;
  url: string;
}

export interface AiPendingAction {
  actionId: string;
  actionType: 'enrich_lead' | 'update_lead' | 'update_user' | 'create_meeting';
  status: 'pending' | 'confirmed' | 'rejected';
  targetId?: string;
  targetLabel: string;
  summary?: string;
  before: Record<string, unknown>;
  proposed: Record<string, unknown>;
  applied?: Record<string, unknown>;
  sources?: AiCitationSource[];
  createdAt: string;
  resolvedAt?: string;
}

export interface AiToolCallLog {
  name: string;
  args: Record<string, unknown>;
  summary?: string;
}

export interface AiMessage {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: AiProviderType;
  toolCalls?: AiToolCallLog[];
  pendingAction?: AiPendingAction;
  citations?: AiCitationSource[];
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    usingByok: boolean;
  };
  createdAt: string;
}

export interface AiConversationSummary {
  _id: string;
  title: string;
  provider: AiProviderType;
  contextLeadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversation extends AiConversationSummary {
  messages: AiMessage[];
}

export interface AdminUserAiQuotaRow {
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  department?: string;
  preferredProvider: AiProviderType;
  tokensUsed: number;
  totalByokTokensUsed: number;
  tokenLimitOverride: number | null;
  effectiveTokenLimit: number;
  hasCustomKey: boolean;
}

export interface AdminUsersQuotaResponse {
  defaultUserTokenLimit: number;
  defaultProvider: AiProviderType;
  users: AdminUserAiQuotaRow[];
}

export const useAiConfig = (options?: { enabled?: boolean }) => {
  const userId = useAuthStore((s) => s.user?._id);
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['ai', 'config', userId, organizationId],
    enabled: (options?.enabled ?? true) && Boolean(userId),
    queryFn: () =>
      api.get<ApiResponse<AiQuotaSummary>>('/ai/config').then((r) => r.data.data),
  });
};

export const useUpdateAiKeys = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      preferredProvider?: AiProviderType;
      geminiApiKey?: string | null;
      claudeApiKey?: string | null;
    }) =>
      api
        .put<ApiResponse<AiQuotaSummary>>('/ai/config/keys', payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'config'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'admin', 'users-quota'] });
    },
  });
};

export const useAiConversations = (options?: { enabled?: boolean }) => {
  const userId = useAuthStore((s) => s.user?._id);
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['ai', 'conversations', userId, organizationId],
    enabled: (options?.enabled ?? true) && Boolean(userId),
    queryFn: () =>
      api
        .get<ApiResponse<AiConversationSummary[]>>('/ai/conversations')
        .then((r) => r.data.data),
  });
};

export const useAiConversation = (conversationId: string | null) => {
  const userId = useAuthStore((s) => s.user?._id);
  return useQuery({
    queryKey: ['ai', 'conversation', conversationId, userId],
    enabled: Boolean(conversationId && userId),
    queryFn: () =>
      api
        .get<ApiResponse<AiConversation>>(`/ai/conversations/${conversationId}`)
        .then((r) => r.data.data),
  });
};

export const useDeleteAiConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      api.delete(`/ai/conversations/${conversationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
  });
};

export const useSendAiMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      conversationId?: string;
      message: string;
      provider?: AiProviderType;
      contextLeadId?: string;
      requestId?: string;
    }) =>
      api
        .post<
          ApiResponse<{
            conversation: AiConversation;
            replyMessage: AiMessage;
            quota: AiQuotaSummary;
          }>
        >('/ai/chat', payload)
        .then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['ai', 'conversation', data.conversation._id, useAuthStore.getState().user?._id],
        data.conversation,
      );
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'config'] });
    },
  });
};

export const useEnrichLeadWithAi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      provider,
      extraInstructions,
      conversationId,
      requestId,
    }: {
      leadId: string;
      provider?: AiProviderType;
      extraInstructions?: string;
      conversationId?: string;
      requestId?: string;
    }) =>
      api
        .post<
          ApiResponse<{
            enrichment: {
              leadId: string;
              leadName: string;
              summary: string;
              pendingAction: AiPendingAction;
            };
            conversation: AiConversation;
            replyMessage: AiMessage;
            quota: AiQuotaSummary;
          }>
        >(`/ai/enrich-lead/${leadId}`, {
          provider,
          extraInstructions,
          conversationId,
          requestId,
        })
        .then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['ai', 'conversation', data.conversation._id, useAuthStore.getState().user?._id],
        data.conversation,
      );
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'config'] });
    },
  });
};

export const useConfirmAiAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      actionId,
      overrides,
    }: {
      actionId: string;
      overrides?: Record<string, unknown>;
    }) =>
      api
        .post<
          ApiResponse<{
            action: AiPendingAction;
            entityResult: unknown;
            conversationId: string;
          }>
        >(`/ai/actions/${actionId}/confirm`, { overrides })
        .then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['ai', 'conversation', data.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useRejectAiAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) =>
      api
        .post<
          ApiResponse<{
            action: AiPendingAction;
            conversationId: string;
          }>
        >(`/ai/actions/${actionId}/reject`)
        .then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['ai', 'conversation', data.conversationId],
      });
    },
  });
};

export const useAdminUserAiQuotas = (enabled = true) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['ai', 'admin', 'users-quota', organizationId],
    enabled,
    queryFn: () =>
      api
        .get<ApiResponse<AdminUsersQuotaResponse>>('/ai/admin/users-quota')
        .then((r) => r.data.data),
  });
};

export const useUpdateAdminUserAiQuota = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      tokenLimitOverride,
      resetUsage,
    }: {
      userId: string;
      tokenLimitOverride?: number | null;
      resetUsage?: boolean;
    }) =>
      api
        .patch<ApiResponse<AiQuotaSummary>>(`/ai/admin/users-quota/${userId}`, {
          tokenLimitOverride,
          resetUsage,
        })
        .then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'admin', 'users-quota'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'config'] });
    },
  });
};
