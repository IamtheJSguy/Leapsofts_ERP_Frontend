import { create } from 'zustand';
import type { Conversation, Message, PresenceStatus, UserPresence } from '@/types';

interface ChatState {
  activeConversationId: string | null;
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, string[]>;
  replyingTo: Message | null;
  presenceByUserId: Record<string, UserPresence>;
  setActiveConversation: (id: string | null) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  syncUnreadFromConversations: (conversations: Pick<Conversation, '_id' | 'unreadCount'>[]) => void;
  resetUnreadCounts: () => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  addTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  setReplyingTo: (message: Message | null) => void;
  setPresence: (userId: string, status: PresenceStatus, lastSeenAt?: string) => void;
  getPresence: (userId: string) => UserPresence;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeConversationId: null,
  unreadCounts: {},
  typingUsers: {},
  replyingTo: null,
  presenceByUserId: {},
  setActiveConversation: (id) => set({ activeConversationId: id, replyingTo: null }),
  setUnreadCount: (conversationId, count) =>
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [conversationId]: count },
    })),
  syncUnreadFromConversations: (conversations) =>
    set((s) => {
      if (!conversations.length) return s;
      const next = { ...s.unreadCounts };
      for (const conv of conversations) {
        const apiCount = conv.unreadCount || 0;
        next[conv._id] = Math.max(next[conv._id] || 0, apiCount);
      }
      return { unreadCounts: next };
    }),
  resetUnreadCounts: () => set({ unreadCounts: {} }),
  incrementUnread: (conversationId) =>
    set((s) => ({
      unreadCounts: {
        ...s.unreadCounts,
        [conversationId]: (s.unreadCounts[conversationId] || 0) + 1,
      },
    })),
  clearUnread: (conversationId) =>
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [conversationId]: 0 },
    })),
  addTypingUser: (conversationId, userId) =>
    set((s) => {
      const current = s.typingUsers[conversationId] || [];
      if (current.includes(userId)) return s;
      return {
        typingUsers: { ...s.typingUsers, [conversationId]: [...current, userId] },
      };
    }),
  removeTypingUser: (conversationId, userId) =>
    set((s) => {
      const current = s.typingUsers[conversationId] || [];
      return {
        typingUsers: {
          ...s.typingUsers,
          [conversationId]: current.filter((id) => id !== userId),
        },
      };
    }),
  setReplyingTo: (message) => set({ replyingTo: message }),
  setPresence: (userId, status, lastSeenAt) =>
    set((s) => ({
      presenceByUserId: {
        ...s.presenceByUserId,
        [userId]: {
          status,
          lastSeenAt: lastSeenAt ?? s.presenceByUserId[userId]?.lastSeenAt,
        },
      },
    })),
  getPresence: (userId) => get().presenceByUserId[userId] || { status: 'offline' },
}));
