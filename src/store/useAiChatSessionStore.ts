import { create } from 'zustand';
import type { AiMessage, AiProviderType } from '@/hooks/api/useAi';

export interface AiChatDisplayMessage extends AiMessage {
  isOptimistic?: boolean;
  isError?: boolean;
  isStopped?: boolean;
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

export const NEW_CONV_KEY = '__new__';

export const generateClientObjectId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return (timestamp + randomBytes).slice(0, 24).toLowerCase();
};

export const isDraftKey = (key?: string | null): boolean => {
  if (!key) return false;
  return key === NEW_CONV_KEY || key.startsWith('draft_');
};

export const getConvKey = (conversationId?: string | null): string =>
  conversationId || NEW_CONV_KEY;

// Keep AbortControllers outside serialized Zustand state to prevent cloning / proxy issues
const activeAbortControllers = new Map<string, AbortController>();

interface AiChatSessionState {
  activeConversationId: string | null;
  provider: AiProviderType;
  /** Active draft conversation keys */
  drafts: string[];
  /** Keyed by conversationId, or draft ID (e.g. '__new__', 'draft_...') */
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

  // Multi-draft & Abort actions
  createDraftConversation: () => string;
  removeDraft: (draftKey: string) => void;
  registerAbortController: (convKey: string, controller: AbortController) => void;
  unregisterAbortController: (convKey: string) => void;
  abortOperation: (convKey: string, reason?: string) => boolean;
}

export const useAiChatSessionStore = create<AiChatSessionState>((set, get) => ({
  activeConversationId: null,
  provider: 'gemini',
  drafts: [],
  ephemeralByConv: {},
  pendingByConv: {},
  lastCompletedPhasesByConv: {},

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setProvider: (provider) => set({ provider }),

  createDraftConversation: () => {
    const state = get();
    // If currently active chat is an empty draft with no running task, reuse it
    if (
      state.activeConversationId &&
      isDraftKey(state.activeConversationId) &&
      !state.pendingByConv[state.activeConversationId] &&
      (!state.ephemeralByConv[state.activeConversationId] ||
        state.ephemeralByConv[state.activeConversationId].length === 0)
    ) {
      return state.activeConversationId;
    }

    const newDraftId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({
      activeConversationId: newDraftId,
      drafts: [...s.drafts.filter((d) => d !== newDraftId), newDraftId],
    }));
    return newDraftId;
  },

  removeDraft: (draftKey: string) => {
    const state = get();
    // Abort if running
    state.abortOperation(draftKey, 'Draft discarded');

    set((s) => {
      const nextEphemeral = { ...s.ephemeralByConv };
      delete nextEphemeral[draftKey];

      const nextPending = { ...s.pendingByConv };
      delete nextPending[draftKey];

      const nextCompleted = { ...s.lastCompletedPhasesByConv };
      delete nextCompleted[draftKey];

      const nextDrafts = s.drafts.filter((d) => d !== draftKey);

      let nextActive = s.activeConversationId;
      if (s.activeConversationId === draftKey) {
        // Switch to newest remaining draft or null
        nextActive = nextDrafts.length > 0 ? nextDrafts[nextDrafts.length - 1] : null;
      }

      return {
        ephemeralByConv: nextEphemeral,
        pendingByConv: nextPending,
        lastCompletedPhasesByConv: nextCompleted,
        drafts: nextDrafts,
        activeConversationId: nextActive,
      };
    });
  },

  registerAbortController: (convKey: string, controller: AbortController) => {
    activeAbortControllers.set(convKey, controller);
  },

  unregisterAbortController: (convKey: string) => {
    activeAbortControllers.delete(convKey);
  },

  abortOperation: (convKey: string, reason?: string) => {
    const controller = activeAbortControllers.get(convKey);
    if (controller) {
      try {
        controller.abort();
      } catch {
        // ignore
      }
      activeAbortControllers.delete(convKey);
    }

    const state = get();
    const currentOp = state.pendingByConv[convKey];
    if (!currentOp && !controller) {
      return false;
    }

    // Mark running phases as stopped/cancelled
    const stoppedPhases: AiAgentPhaseItem[] = (currentOp?.phases ?? []).map((p) =>
      p.status === 'running'
        ? {
            ...p,
            status: 'error' as const,
            detail: reason || 'Task stopped by user',
          }
        : p,
    );

    set((s) => {
      const nextPending = { ...s.pendingByConv };
      delete nextPending[convKey];

      const nextCompleted = { ...s.lastCompletedPhasesByConv };
      if (stoppedPhases.length > 0) {
        nextCompleted[convKey] = stoppedPhases;
      }

      const existingMsgs = s.ephemeralByConv[convKey] ?? [];
      const updatedMsgs = existingMsgs.map((m) =>
        m.isOptimistic ? { ...m, isOptimistic: false, isStopped: true } : m,
      );

      return {
        pendingByConv: nextPending,
        lastCompletedPhasesByConv: nextCompleted,
        ephemeralByConv: {
          ...s.ephemeralByConv,
          [convKey]: updatedMsgs,
        },
      };
    });

    return true;
  },

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

  moveConversationState: (fromKey, toKey) => {
    // Transfer controller if in-flight
    const ctrl = activeAbortControllers.get(fromKey);
    if (ctrl) {
      activeAbortControllers.set(toKey, ctrl);
      activeAbortControllers.delete(fromKey);
    }

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
      const nextDrafts = state.drafts.filter((d) => d !== fromKey);

      const nextActiveId =
        state.activeConversationId === fromKey ? toKey : state.activeConversationId;

      return {
        ephemeralByConv: nextEphemeral,
        pendingByConv: nextPending,
        lastCompletedPhasesByConv: nextCompleted,
        drafts: nextDrafts,
        activeConversationId: nextActiveId,
      };
    });
  },

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

      // Find matching pending operation by requestId first, then conversationId, then draft key
      let matchedKey: string | undefined;
      if (payload.requestId) {
        matchedKey = pendingKeys.find(
          (k) => state.pendingByConv[k]?.requestId === payload.requestId,
        );
      }
      if (!matchedKey && payload.conversationId && state.pendingByConv[payload.conversationId]) {
        matchedKey = payload.conversationId;
      }
      if (!matchedKey && state.activeConversationId && state.pendingByConv[state.activeConversationId]) {
        matchedKey = state.activeConversationId;
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
