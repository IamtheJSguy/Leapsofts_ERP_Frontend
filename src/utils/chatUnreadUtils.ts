import type { Conversation } from '@/types';

export const conversationBoardId = (
  conversation: Pick<Conversation, 'boardId'>,
): string | undefined => {
  const raw = conversation.boardId as string | { _id?: string } | undefined;
  if (!raw) return undefined;
  if (typeof raw === 'string') return raw;
  return raw._id;
};

/** Title shown in the chat list and open-chat header. Prefers live board name. */
export const getConversationTitle = (
  conversation: Pick<Conversation, 'name' | 'isGroup' | 'boardId'>,
  liveBoardName?: string,
): string => {
  const fromBoard = liveBoardName?.trim();
  if (fromBoard) return fromBoard;
  const stored = conversation.name?.trim();
  if (stored) return stored;
  if (conversationBoardId(conversation)) return '';
  return conversation.isGroup ? 'Group Chat' : 'Chat';
};


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
