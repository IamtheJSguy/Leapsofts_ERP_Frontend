import axios from 'axios';
import api from '@/lib/axios';
import type { Message } from '@/types';
import { closeRemovedConversation } from '@/utils/closeRemovedConversation';
import { normalizeMessageReceipts } from '@/utils/chatMessageUtils';
import { CHAT_MESSAGE_PAGE_SIZE, type MessagesPage } from '@/utils/chatMessageCache';

export const fetchMessagesPage = async (
  conversationId: string,
  pageParam?: string,
): Promise<MessagesPage> => {
  const params: Record<string, string> = { limit: String(CHAT_MESSAGE_PAGE_SIZE) };
  if (pageParam) params.before = pageParam;
  try {
    const r = await api.get<{
      data: Message[];
      meta?: { page: number; limit: number; total: number; hasMore?: boolean };
    }>(`/chat/conversations/${conversationId}/messages`, { params });
    const messages = (r.data.data || []).map(normalizeMessageReceipts);
    const hasMore = r.data.meta?.hasMore ?? messages.length === CHAT_MESSAGE_PAGE_SIZE;
    return { messages, hasMore };
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    if (status === 403 || status === 404) {
      closeRemovedConversation(conversationId);
    }
    throw err;
  }
};
