export const DRAFT_STORAGE_PREFIX = 'chat_draft:';
export const CHAT_DRAFT_CHANGED_EVENT = 'chat-draft-changed';

export interface ChatDraftItem {
  text: string;
  updatedAt: number;
}

/**
 * Dispatches a custom window event when a draft changes locally within the current tab.
 */
export const dispatchDraftChangeEvent = (
  conversationId: string,
  text: string,
  updatedAt: number = Date.now()
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CHAT_DRAFT_CHANGED_EVENT, {
        detail: { conversationId, text, updatedAt },
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
 * Extracts draft text and updatedAt timestamp from raw localStorage value.
 * Supports both JSON `{ text, updatedAt }` and legacy plain text string.
 */
export const extractDraftData = (rawValue: string | null | undefined): ChatDraftItem => {
  if (!rawValue || typeof rawValue !== 'string') {
    return { text: '', updatedAt: 0 };
  }
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { text: '', updatedAt: 0 };
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && typeof parsed.text === 'string') {
        return {
          text: parsed.text,
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
        };
      }
    } catch {
      // Not valid JSON, return as plain text
    }
  }

  return { text: rawValue, updatedAt: 0 };
};

/**
 * Extracts draft text from raw localStorage value, supporting both plain text and JSON.
 */
export const extractDraftText = (rawValue: string | null | undefined): string => {
  return extractDraftData(rawValue).text;
};

/**
 * Loads a saved draft for a conversation ID from browser localStorage.
 */
export const loadDraft = (conversationId: string): string => {
  if (!conversationId || typeof window === 'undefined') return '';
  try {
    const key = getDraftStorageKey(conversationId);
    const raw = window.localStorage.getItem(key);
    const data = extractDraftData(raw);
    if (isDraftEmpty(data.text)) {
      if (raw !== null) {
        window.localStorage.removeItem(key);
      }
      return '';
    }
    return data.text;
  } catch (err) {
    console.error('Failed to load chat draft from localStorage', err);
    return '';
  }
};

/**
 * Loads all active drafts currently stored in localStorage, including their timestamps.
 */
export const getAllDrafts = (): Record<string, ChatDraftItem> => {
  if (typeof window === 'undefined') return {};
  const drafts: Record<string, ChatDraftItem> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && isDraftStorageKey(key)) {
        const convId = getConversationIdFromKey(key);
        if (convId) {
          const raw = window.localStorage.getItem(key);
          const data = extractDraftData(raw);
          if (!isDraftEmpty(data.text)) {
            drafts[convId] = data;
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
 * Saves a draft for a conversation ID to browser localStorage with updatedAt timestamp.
 * If the draft is empty or whitespace-only, the key is removed instead.
 */
export const saveDraft = (
  conversationId: string,
  content: string,
  updatedAt: number = Date.now()
): void => {
  if (!conversationId || typeof window === 'undefined') return;
  try {
    const key = getDraftStorageKey(conversationId);
    if (isDraftEmpty(content)) {
      window.localStorage.removeItem(key);
      dispatchDraftChangeEvent(conversationId, '', 0);
    } else {
      const payload = JSON.stringify({ text: content, updatedAt });
      window.localStorage.setItem(key, payload);
      dispatchDraftChangeEvent(conversationId, content, updatedAt);
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
    dispatchDraftChangeEvent(conversationId, '', 0);
  } catch (err) {
    console.error('Failed to remove chat draft from localStorage', err);
  }
};
