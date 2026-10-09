import type { InfiniteData } from '@tanstack/react-query';
import type { Message } from '@/types';

export const CHAT_MESSAGE_PAGE_SIZE = 30;

/** Socket/IDB-backed message caches stay fresh; avoid remount refetches. */
export const MESSAGES_STALE_TIME_MS = Number.POSITIVE_INFINITY;

export type MessagesPage = {
  messages: Message[];
  hasMore: boolean;
};

export type MessagesInfiniteData = InfiniteData<MessagesPage, string | undefined>;

export const messagesQueryKey = (
  conversationId: string | null,
  organizationId: string | undefined | null,
) => ['messages', conversationId, organizationId] as const;

export const isMessagesInfiniteData = (old: unknown): old is MessagesInfiniteData =>
  !!old && typeof old === 'object' && Array.isArray((old as MessagesInfiniteData).pages);

export const flattenMessagePages = (data: MessagesInfiniteData | undefined): Message[] => {
  if (!data?.pages?.length) return [];
  return [...data.pages].reverse().flatMap((page) => page.messages);
};

/** True when the cached pages already include the conversation's lastMessage. */
export const cacheIncludesLastMessage = (
  data: MessagesInfiniteData | Message[] | undefined,
  lastMessageId: string | undefined,
): boolean => {
  if (!lastMessageId) return Boolean(data && (Array.isArray(data) ? data.length : data.pages?.length));
  if (!data) return false;
  if (Array.isArray(data)) return data.some((m) => m._id === lastMessageId);
  if (!isMessagesInfiniteData(data)) return false;
  return data.pages.some((page) => page.messages.some((m) => m._id === lastMessageId));
};

/**
 * Socket MESSAGE_NEW seeds an unopened chat with a one-message page (hasMore: true).
 * That stub must still be replaced by a real latest-page prefetch.
 */
export const isSocketSeededMessageStub = (
  data: MessagesInfiniteData | Message[] | undefined,
): boolean => {
  if (!isMessagesInfiniteData(data) || data.pages.length !== 1) return false;
  const page = data.pages[0];
  return page.hasMore === true && page.messages.length === 1;
};

/** Whether we should prefetch the latest page for this conversation. */
export const conversationNeedsMessageWarm = (
  data: MessagesInfiniteData | Message[] | undefined,
  lastMessageId: string | undefined,
): boolean => {
  if (isSocketSeededMessageStub(data)) return true;
  return !cacheIncludesLastMessage(data, lastMessageId);
};

export const mapMessageCache = (
  old: Message[] | MessagesInfiniteData | undefined,
  mapFn: (messages: Message[]) => Message[],
): Message[] | MessagesInfiniteData | undefined => {
  if (!old) return old;
  if (Array.isArray(old)) return mapFn(old);
  if (!isMessagesInfiniteData(old)) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      messages: mapFn(page.messages),
    })),
  };
};

export const appendMessageToCache = (
  old: Message[] | MessagesInfiniteData | undefined,
  message: Message,
): Message[] | MessagesInfiniteData => {
  if (!old) {
    // Unknown prior history — allow scroll-back to load older pages.
    return { pages: [{ messages: [message], hasMore: true }], pageParams: [undefined] };
  }

  const isDuplicate = (m: Message) => m._id === message._id;
  
  const isOptimisticMatch = (m: Message) => 
    m.isPending && 
    (
      (m.type === 'text' && m.content === message.content) || 
      (m.type === 'file' && message.type === 'file' && m.content === message.content)
    );

  if (Array.isArray(old)) {
    if (old.some(isDuplicate)) return old;
    const optIdx = old.findIndex(isOptimisticMatch);
    if (optIdx !== -1) {
      const next = [...old];
      next[optIdx] = { ...message, clientId: next[optIdx]._id };
      return next;
    }
    return [...old, message];
  }
  
  if (!isMessagesInfiniteData(old)) {
    return { pages: [{ messages: [message], hasMore: false }], pageParams: [undefined] };
  }
  
  if (old.pages.some((page) => page.messages.some(isDuplicate))) {
    return old;
  }
  
  if (old.pages.length === 0) {
    return { pages: [{ messages: [message], hasMore: false }], pageParams: [undefined] };
  }
  
  const pages = [...old.pages];
  const firstPageMessages = [...pages[0].messages];
  
  const optIdx = firstPageMessages.findIndex(isOptimisticMatch);
  if (optIdx !== -1) {
    firstPageMessages[optIdx] = { ...message, clientId: firstPageMessages[optIdx]._id };
  } else {
    firstPageMessages.push(message);
  }
  
  pages[0] = { ...pages[0], messages: firstPageMessages };
  return { ...old, pages };
};
