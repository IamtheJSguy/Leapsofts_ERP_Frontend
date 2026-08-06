import type { Conversation } from '@/types';

/** Unread count for a conversation, merging API data with live socket increments. */
export const getMergedUnreadCount = (
  conversation: Pick<Conversation, '_id' | 'unreadCount'>,
  unreadCounts: Record<string, number>,
): number => Math.max(conversation.unreadCount || 0, unreadCounts[conversation._id] || 0);

/** Number of conversations that have at least one unread message. */
export const countConversationsWithUnread = (
  conversations: Conversation[],
  unreadCounts: Record<string, number>,
): number =>
  conversations.filter((conv) => getMergedUnreadCount(conv, unreadCounts) > 0).length;
