import type { InfiniteData } from '@tanstack/react-query';
import type { Message } from '@/types';
import { stripHtml } from '@/utils/chatMessageUtils';

const senderIdOf = (message: Message): string => {
  if (message.senderId) {
    return typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
  }
  if (message.sender) {
    return typeof message.sender === 'string' ? message.sender : message.sender._id;
  }
  return '';
};

const normalizeComparableContent = (content: string, type?: string): string => {
  const raw = content || '';
  if (type === 'text' || !type) {
    const stripped = stripHtml(raw).trim().replace(/\s+/g, ' ');
    if (stripped) return stripped;
  }
  return raw.trim();
};

/** Whether an optimistic row likely represents the same outgoing message as the server payload. */
export const optimisticMatchesIncoming = (pending: Message, incoming: Message): boolean => {
  if (!pending.isPending) return false;
  if (pending.clientMessageId && incoming.clientMessageId) {
    return pending.clientMessageId === incoming.clientMessageId;
  }
  const pendingType = pending.type || 'text';
  const incomingType = incoming.type || 'text';
  if (pendingType !== incomingType) return false;
  if (pendingType === 'drive_file') {
    return Boolean(pending.driveFileId && pending.driveFileId === incoming.driveFileId);
  }
  if (pendingType === 'file') {
    return (
      normalizeComparableContent(pending.content, 'file') ===
      normalizeComparableContent(incoming.content, 'file')
    );
  }
  return (
    normalizeComparableContent(pending.content, 'text') ===
    normalizeComparableContent(incoming.content, 'text')
  );
};

const mergeIncomingIntoMessages = (
  messages: Message[],
  incoming: Message,
  currentUserId?: string,
): Message[] => {
  if (messages.some((m) => m._id === incoming._id)) {
    return messages.filter((m) => !(m.isPending && optimisticMatchesIncoming(m, incoming)));
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (optimisticMatchesIncoming(messages[i], incoming)) {
      const next = [...messages];
      next[i] = { ...incoming, clientId: messages[i]._id, isPending: false };
      return next;
    }
  }

  if (currentUserId && senderIdOf(incoming) === currentUserId) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const pending = messages[i];
      if (pending.isPending && senderIdOf(pending) === currentUserId) {
        const next = [...messages];
        next[i] = { ...incoming, clientId: pending._id, isPending: false };
        return next;
      }
    }
  }

  return [...messages, incoming];
};

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

export const findMessageInCache = (
  data: MessagesInfiniteData | Message[] | undefined,
  messageId: string,
): Message | undefined => {
  if (!data || !messageId) return undefined;
  if (Array.isArray(data)) return data.find((m) => m._id === messageId);
  if (!isMessagesInfiniteData(data)) return undefined;
  for (const page of data.pages) {
    const found = page.messages.find((m) => m._id === messageId);
    if (found) return found;
  }
  return undefined;
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
  options?: { currentUserId?: string },
): Message[] | MessagesInfiniteData => {
  const currentUserId = options?.currentUserId;

  if (!old) {
    // Unknown prior history — allow scroll-back to load older pages.
    return { pages: [{ messages: [message], hasMore: true }], pageParams: [undefined] };
  }

  if (Array.isArray(old)) {
    return mergeIncomingIntoMessages(old, message, currentUserId);
  }

  if (!isMessagesInfiniteData(old)) {
    return { pages: [{ messages: [message], hasMore: false }], pageParams: [undefined] };
  }

  if (old.pages.length === 0) {
    return { pages: [{ messages: [message], hasMore: false }], pageParams: [undefined] };
  }

  const hasRealId = old.pages.some((page) => page.messages.some((m) => m._id === message._id));
  if (hasRealId) {
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        messages: page.messages.filter(
          (m) => !(m.isPending && optimisticMatchesIncoming(m, message)),
        ),
      })),
    };
  }

  const pages = [...old.pages];
  const firstPageMessages = mergeIncomingIntoMessages(
    [...pages[0].messages],
    message,
    currentUserId,
  );
  pages[0] = { ...pages[0], messages: firstPageMessages };
  return { ...old, pages };
};
