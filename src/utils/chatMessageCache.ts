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
