export const DRAFT_STORAGE_PREFIX = 'chat_draft:';
export const CHAT_DRAFT_CHANGED_EVENT = 'chat-draft-changed';

/**
 * Dispatches a custom window event when a draft changes locally within the current tab.
 */
export const dispatchDraftChangeEvent = (conversationId: string, text: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CHAT_DRAFT_CHANGED_EVENT, {
        detail: { conversationId, text },
      })
    );
  }
};

/**
 * Returns the unique localStorage key for a given conversation or recipient ID.
 */
export const getDraftStorageKey = (conversationId: string): string => {
  return `${DRAFT_STORAGE_PREFIX}${conversationId}`;
};

/**
 * Checks if a given storage key belongs to a chat draft.
 */
export const isDraftStorageKey = (key: string): boolean => {
  return typeof key === 'string' && key.startsWith(DRAFT_STORAGE_PREFIX);
};

/**
 * Extracts the conversation or recipient ID from a storage key.
 */
export const getConversationIdFromKey = (key: string): string | null => {
  if (!isDraftStorageKey(key)) return null;
  return key.slice(DRAFT_STORAGE_PREFIX.length) || null;
};

/**
 * Checks if a draft text (which can be HTML from rich text editor) is empty or whitespace-only.
 */
export const isDraftEmpty = (htmlOrText: string | null | undefined): boolean => {
  if (!htmlOrText || typeof htmlOrText !== 'string') return true;

  const rawTrimmed = htmlOrText.trim();
  if (!rawTrimmed) return true;

  // Plain text without HTML tags
  if (!htmlOrText.includes('<')) {
    return false;
  }

  // Replace common HTML whitespace and non-breaking space entities
  const withoutEntities = htmlOrText
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&#xA0;/gi, ' ');

  // Strip tags: replace linebreaks and closing block tags with spaces, then remove all tags
  const stripped = withoutEntities
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/[\s\u00a0]+/g, ' ')
    .trim();

  return stripped.length === 0;
};

/**
 * Extracts draft text from raw localStorage value, supporting both plain text and JSON.
 */
export const extractDraftText = (rawValue: string | null | undefined): string => {
  if (!rawValue || typeof rawValue !== 'string') return '';
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && typeof parsed.text === 'string') {
        return parsed.text;
      }
    } catch {
      // Not valid JSON, return as plain text
    }
  }

  return rawValue;
};

/**
 * Loads a saved draft for a conversation ID from browser localStorage.
 */
export const loadDraft = (conversationId: string): string => {
  if (!conversationId || typeof window === 'undefined') return '';
  try {
    const key = getDraftStorageKey(conversationId);
    const raw = window.localStorage.getItem(key);
    const text = extractDraftText(raw);
    if (isDraftEmpty(text)) {
      if (raw !== null) {
        window.localStorage.removeItem(key);
      }
      return '';
    }
    return text;
  } catch (err) {
    console.error('Failed to load chat draft from localStorage', err);
    return '';
  }
};

/**
 * Loads all active drafts currently stored in localStorage.
 */
export const getAllDrafts = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const drafts: Record<string, string> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && isDraftStorageKey(key)) {
        const convId = getConversationIdFromKey(key);
        if (convId) {
          const raw = window.localStorage.getItem(key);
          const text = extractDraftText(raw);
          if (!isDraftEmpty(text)) {
            drafts[convId] = text;
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load all chat drafts from localStorage', err);
  }
  return drafts;
};

/**
 * Saves a draft for a conversation ID to browser localStorage.
 * If the draft is empty or whitespace-only, the key is removed instead.
 */
export const saveDraft = (conversationId: string, content: string): void => {
  if (!conversationId || typeof window === 'undefined') return;
  try {
    const key = getDraftStorageKey(conversationId);
    if (isDraftEmpty(content)) {
      window.localStorage.removeItem(key);
      dispatchDraftChangeEvent(conversationId, '');
    } else {
      window.localStorage.setItem(key, content);
      dispatchDraftChangeEvent(conversationId, content);
    }
  } catch (err) {
    console.error('Failed to save chat draft to localStorage', err);
  }
};

/**
 * Removes a saved draft for a conversation ID from browser localStorage.
 */
export const clearDraft = (conversationId: string): void => {
  if (!conversationId || typeof window === 'undefined') return;
  try {
    const key = getDraftStorageKey(conversationId);
    window.localStorage.removeItem(key);
    dispatchDraftChangeEvent(conversationId, '');
  } catch (err) {
    console.error('Failed to remove chat draft from localStorage', err);
  }
};
