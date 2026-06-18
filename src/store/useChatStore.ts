import { create } from 'zustand';

interface ChatState {
  activeConversationId: string | null;
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, string[]>;
  setActiveConversation: (id: string | null) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  addTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  unreadCounts: {},
  typingUsers: {},
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setUnreadCount: (conversationId, count) =>
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [conversationId]: count },
    })),
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
}));
