import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info' | 'message';
  title?: string;
  avatar?: string;
  onClick?: () => void;
  conversationId?: string;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  activeModal: string | null;
  notificationPanelOpen: boolean;
  assistantBubbleOpen: boolean;
  toastQueue: Toast[];
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  toggleNotificationPanel: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setAssistantBubbleOpen: (open: boolean) => void;
  toggleAssistantBubble: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  activeModal: null,
  notificationPanelOpen: false,
  assistantBubbleOpen: false,
  toastQueue: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  toggleNotificationPanel: () =>
    set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
  setAssistantBubbleOpen: (open) => set({ assistantBubbleOpen: open }),
  toggleAssistantBubble: () =>
    set((s) => ({ assistantBubbleOpen: !s.assistantBubbleOpen })),
  addToast: (toast) =>
    set((s) => ({
      toastQueue: [...s.toastQueue, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),
}));
