import type { InfiniteData } from '@tanstack/react-query';
import type { Message } from '@/types';

export const CHAT_MESSAGE_PAGE_SIZE = 30;

export type MessagesPage = {
  messages: Message[];
  hasMore: boolean;
};

export type MessagesInfiniteData = InfiniteData<MessagesPage, string | undefined>;

export const isMessagesInfiniteData = (old: unknown): old is MessagesInfiniteData =>
  !!old && typeof old === 'object' && Array.isArray((old as MessagesInfiniteData).pages);

export const flattenMessagePages = (data: MessagesInfiniteData | undefined): Message[] => {
  if (!data?.pages?.length) return [];
  return [...data.pages].reverse().flatMap((page) => page.messages);
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
    return { pages: [{ messages: [message], hasMore: false }], pageParams: [undefined] };
  }
  if (Array.isArray(old)) {
    if (old.some((m) => m._id === message._id)) return old;
    return [...old, message];
  }
  if (!isMessagesInfiniteData(old)) {
    return { pages: [{ messages: [message], hasMore: false }], pageParams: [undefined] };
  }
  if (old.pages.some((page) => page.messages.some((m) => m._id === message._id))) {
    return old;
  }
  if (old.pages.length === 0) {
    return { pages: [{ messages: [message], hasMore: false }], pageParams: [undefined] };
  }
  const pages = [...old.pages];
  pages[0] = { ...pages[0], messages: [...pages[0].messages, message] };
  return { ...old, pages };
};
