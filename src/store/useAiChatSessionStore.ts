import { create } from 'zustand';
import type { AiMessage, AiProviderType } from '@/hooks/api/useAi';

export interface AiChatDisplayMessage extends AiMessage {
  isOptimistic?: boolean;
  isError?: boolean;
  retryPrompt?: string;
  failedUserMsgId?: string;
}

export interface AiAgentPhaseItem {
  stepId: string;
  status: 'running' | 'completed' | 'error';
  label: string;
  detail?: string;
  timestamp: string;
}

export interface PendingAiOperation {
  conversationKey: string;
  requestId?: string;
  provider: AiProviderType;
  kind: 'chat' | 'enrich';
  startedAt: number;
  phases: AiAgentPhaseItem[];
}

interface AiChatSessionState {
  activeConversationId: string | null;
  provider: AiProviderType;
  /** Keyed by conversationId, or '__new__' for a brand-new unsaved chat */
  ephemeralByConv: Record<string, AiChatDisplayMessage[]>;
  pendingByConv: Record<string, PendingAiOperation>;
  /** Completed phase trail keyed by conversationId so users can still see what phases the agent ran after finishing */
  lastCompletedPhasesByConv: Record<string, AiAgentPhaseItem[]>;
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
  recordPhaseEvent: (payload: {
    requestId?: string;
    conversationId?: string;
    stepId: string;
    status: 'running' | 'completed' | 'error';
    label: string;
    detail?: string;
    timestamp: string;
  }) => void;
}

export const NEW_CONV_KEY = '__new__';

export const getConvKey = (conversationId?: string | null): string =>
  conversationId || NEW_CONV_KEY;

export const useAiChatSessionStore = create<AiChatSessionState>((set) => ({
  activeConversationId: null,
  provider: 'gemini',
  ephemeralByConv: {},
  pendingByConv: {},
  lastCompletedPhasesByConv: {},

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
      const nextCompleted = { ...state.lastCompletedPhasesByConv };
      if (nextCompleted[fromKey]) {
        nextCompleted[toKey] = nextCompleted[fromKey];
        delete nextCompleted[fromKey];
      }
      return {
        ephemeralByConv: nextEphemeral,
        pendingByConv: nextPending,
        lastCompletedPhasesByConv: nextCompleted,
      };
    }),

  setPendingOperation: (convKey, op) =>
    set((state) => {
      const next = { ...state.pendingByConv };
      const nextCompleted = { ...state.lastCompletedPhasesByConv };
      if (!op) {
        const finishing = next[convKey];
        if (finishing && finishing.phases.length > 0) {
          nextCompleted[convKey] = finishing.phases.map((p) =>
            p.status === 'running' ? { ...p, status: 'completed' as const } : p,
          );
        }
        delete next[convKey];
      } else {
        next[convKey] = op;
      }
      return { pendingByConv: next, lastCompletedPhasesByConv: nextCompleted };
    }),

  recordPhaseEvent: (payload) =>
    set((state) => {
      const pendingKeys = Object.keys(state.pendingByConv);
      if (pendingKeys.length === 0) return state;

      // Find matching pending operation by requestId first, then conversationId, then '__new__'
      let matchedKey: string | undefined;
      if (payload.requestId) {
        matchedKey = pendingKeys.find(
          (k) => state.pendingByConv[k]?.requestId === payload.requestId,
        );
      }
      if (!matchedKey && payload.conversationId && state.pendingByConv[payload.conversationId]) {
        matchedKey = payload.conversationId;
      }
      if (!matchedKey && state.pendingByConv[NEW_CONV_KEY]) {
        matchedKey = NEW_CONV_KEY;
      }
      if (!matchedKey && pendingKeys.length === 1) {
        matchedKey = pendingKeys[0];
      }

      if (!matchedKey) return state;
      const currentOp = state.pendingByConv[matchedKey];
      if (!currentOp) return state;

      const existingIdx = currentOp.phases.findIndex((p) => p.stepId === payload.stepId);
      const updatedPhase: AiAgentPhaseItem = {
        stepId: payload.stepId,
        status: payload.status,
        label: payload.label,
        detail: payload.detail,
        timestamp: payload.timestamp || new Date().toISOString(),
      };

      let nextPhases: AiAgentPhaseItem[];
      if (existingIdx >= 0) {
        nextPhases = currentOp.phases.map((p, idx) =>
          idx === existingIdx ? { ...p, ...updatedPhase } : p,
        );
      } else {
        // When a new running phase starts, mark any previous 'running' phases as completed so only the active step spins
        nextPhases = [
          ...currentOp.phases.map((p) =>
            p.status === 'running' && payload.status === 'running'
              ? { ...p, status: 'completed' as const }
              : p,
          ),
          updatedPhase,
        ];
      }

      return {
        pendingByConv: {
          ...state.pendingByConv,
          [matchedKey]: {
            ...currentOp,
            phases: nextPhases,
          },
        },
      };
    }),
}));
