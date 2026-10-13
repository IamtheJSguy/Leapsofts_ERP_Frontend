import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  loadDraft,
  saveDraft,
  clearDraft,
  isDraftEmpty,
  isDraftStorageKey,
  getConversationIdFromKey,
  extractDraftText,
  dispatchDraftChangeEvent,
} from '@/utils/chatDraftStorage';

export interface UseChatDraftResult {
  text: string;
  setText: (newText: string) => void;
  removeDraft: (conversationId: string) => void;
  flushDraft: () => void;
}

/**
 * Hook to manage persistent chat drafts per conversation in browser localStorage.
 * Handles debounced auto-saving, instantaneous restoration, multi-tab sync,
 * route navigation, and safe cleanup on successful send.
 */
export function useChatDraft(activeConversationId: string | null): UseChatDraftResult {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ id: string; text: string; updatedAt: number } | null>(null);
  const prevConversationIdRef = useRef<string | null>(activeConversationId);

  // Synchronously compute the current text for the active conversation.
  // If present in state, use it; otherwise read directly from localStorage so there is zero flash.
  const text = useMemo(() => {
    if (!activeConversationId) return '';
    if (activeConversationId in drafts) {
      return drafts[activeConversationId];
    }
    return loadDraft(activeConversationId);
  }, [activeConversationId, drafts]);

  // Flush any pending debounced draft save immediately to localStorage.
  const flushDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingSaveRef.current) {
      const { id, text: pendingText, updatedAt } = pendingSaveRef.current;
      pendingSaveRef.current = null;
      saveDraft(id, pendingText, updatedAt);
    }
  }, []);

  // Flush pending save whenever active conversation switches.
  useEffect(() => {
    if (
      prevConversationIdRef.current &&
      prevConversationIdRef.current !== activeConversationId &&
      pendingSaveRef.current?.id === prevConversationIdRef.current
    ) {
      flushDraft();
    }
    prevConversationIdRef.current = activeConversationId;
  }, [activeConversationId, flushDraft]);

  // Flush pending save on page unload and component unmount.
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushDraft();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushDraft();
    };
  }, [flushDraft]);

  // Listen to cross-tab storage events to keep drafts synchronized across tabs.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || !isDraftStorageKey(event.key)) return;
      const convId = getConversationIdFromKey(event.key);
      if (!convId) return;

      // Avoid overwriting a newer draft with stale state if this tab has a pending debounce for this conv
      if (pendingSaveRef.current && pendingSaveRef.current.id === convId) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        pendingSaveRef.current = null;
      }

      const updatedDraft = event.newValue ? extractDraftText(event.newValue) : '';
      setDrafts((prev) => ({ ...prev, [convId]: updatedDraft }));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Updates the draft in state and schedules debounced save to localStorage.
  const setText = useCallback(
    (newText: string) => {
      if (!activeConversationId) return;
      const currentId = activeConversationId;

      // Update in-memory state immediately for responsive typing
      setDrafts((prev) => ({ ...prev, [currentId]: newText }));

      if (isDraftEmpty(newText)) {
        // Empty or whitespace-only draft: cancel debounce and clear immediately from storage
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        pendingSaveRef.current = null;
        clearDraft(currentId);
      } else {
        const now = Date.now();
        // Broadcast local draft change event immediately so sidebar reflects it without delay
        dispatchDraftChangeEvent(currentId, newText, now);

        // Schedule debounced save
        pendingSaveRef.current = { id: currentId, text: newText, updatedAt: now };
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          saveDraft(currentId, newText, now);
          debounceTimerRef.current = null;
          pendingSaveRef.current = null;
        }, 250);
      }
    },
    [activeConversationId]
  );

  // Clears the draft in memory and removes it from localStorage.
  const removeDraft = useCallback((conversationId: string) => {
    if (!conversationId) return;

    if (debounceTimerRef.current && pendingSaveRef.current?.id === conversationId) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingSaveRef.current?.id === conversationId) {
      pendingSaveRef.current = null;
    }

    clearDraft(conversationId);
    setDrafts((prev) => ({ ...prev, [conversationId]: '' }));
  }, []);

  return {
    text,
    setText,
    removeDraft,
    flushDraft,
  };
}
