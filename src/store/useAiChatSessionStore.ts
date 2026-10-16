import { create } from 'zustand';
import type { AiMessage, AiProviderType } from '@/hooks/api/useAi';

export interface AiChatDisplayMessage extends AiMessage {
  isOptimistic?: boolean;
  isError?: boolean;
  retryPrompt?: string;
  failedUserMsgId?: string;
}

export interface PendingAiOperation {
  conversationKey: string;
  provider: AiProviderType;
  kind: 'chat' | 'enrich';
  startedAt: number;
}

interface AiChatSessionState {
  activeConversationId: string | null;
  provider: AiProviderType;
  /** Keyed by conversationId, or '__new__' for a brand-new unsaved chat */
  ephemeralByConv: Record<string, AiChatDisplayMessage[]>;
  pendingByConv: Record<string, PendingAiOperation>;
  setActiveConversationId: (id: string | null) => void;
  setProvider: (provider: AiProviderType) => void;
  appendEphemeralMessage: (convKey: string, msg: AiChatDisplayMessage) => void;
  updateEphemeralMessages: (
    convKey: string,
    updater: (prev: AiChatDisplayMessage[]) => AiChatDisplayMessage[],
  ) => void;
  clearConversationEphemeral: (convKey: string) => void;
  moveConversationState: (fromKey: string, toKey: string) => void;
  setPendingOperation: (convKey: string, op: PendingAiOperation | null) => void;
}

export const NEW_CONV_KEY = '__new__';

export const getConvKey = (conversationId?: string | null): string =>
  conversationId || NEW_CONV_KEY;

export const useAiChatSessionStore = create<AiChatSessionState>((set) => ({
  activeConversationId: null,
  provider: 'gemini',
  ephemeralByConv: {},
  pendingByConv: {},

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setProvider: (provider) => set({ provider }),

  appendEphemeralMessage: (convKey, msg) =>
    set((state) => ({
      ephemeralByConv: {
        ...state.ephemeralByConv,
        [convKey]: [...(state.ephemeralByConv[convKey] ?? []), msg],
      },
    })),

  updateEphemeralMessages: (convKey, updater) =>
    set((state) => ({
      ephemeralByConv: {
        ...state.ephemeralByConv,
        [convKey]: updater(state.ephemeralByConv[convKey] ?? []),
      },
    })),

  clearConversationEphemeral: (convKey) =>
    set((state) => {
      const next = { ...state.ephemeralByConv };
      delete next[convKey];
      return { ephemeralByConv: next };
    }),

  moveConversationState: (fromKey, toKey) =>
    set((state) => {
      if (fromKey === toKey) return state;
      const nextEphemeral = { ...state.ephemeralByConv };
      if (nextEphemeral[fromKey]) {
        nextEphemeral[toKey] = [
          ...(nextEphemeral[toKey] ?? []),
          ...nextEphemeral[fromKey],
        ];
        delete nextEphemeral[fromKey];
      }
      const nextPending = { ...state.pendingByConv };
      if (nextPending[fromKey]) {
        nextPending[toKey] = {
          ...nextPending[fromKey],
          conversationKey: toKey,
        };
        delete nextPending[fromKey];
      }
      return {
        ephemeralByConv: nextEphemeral,
        pendingByConv: nextPending,
      };
    }),

  setPendingOperation: (convKey, op) =>
    set((state) => {
      const next = { ...state.pendingByConv };
      if (!op) {
        delete next[convKey];
      } else {
        next[convKey] = op;
      }
      return { pendingByConv: next };
    }),
}));
