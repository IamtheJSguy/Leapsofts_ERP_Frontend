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
  aiDrawerOpen: boolean;
  aiContextLeadId: string | null;
  toastQueue: Toast[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  toggleNotificationPanel: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  toggleAiDrawer: () => void;
  setAiDrawerOpen: (open: boolean, contextLeadId?: string | null) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const sidebarStartsOpen =
  typeof window === 'undefined' || window.matchMedia('(min-width: 900px)').matches;

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: sidebarStartsOpen,
  theme: 'light',
  activeModal: null,
  notificationPanelOpen: false,
  aiDrawerOpen: false,
  aiContextLeadId: null,
  toastQueue: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  toggleNotificationPanel: () =>
    set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
  toggleAiDrawer: () =>
    set((s) => ({ aiDrawerOpen: !s.aiDrawerOpen })),
  setAiDrawerOpen: (open, contextLeadId) =>
    set((s) => ({
      aiDrawerOpen: open,
      aiContextLeadId: contextLeadId !== undefined ? contextLeadId : s.aiContextLeadId,
    })),
  addToast: (toast) =>
    set((s) => ({
      toastQueue: [...s.toastQueue, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),
}));
