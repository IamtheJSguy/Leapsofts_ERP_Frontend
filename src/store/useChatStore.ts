import { create } from 'zustand';

interface ChatState {
  activeConversationId: string | null;
  unreadCounts: Record<string, number>;
  setActiveConversation: (id: string | null) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  unreadCounts: {},
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
}));
