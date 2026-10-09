import type { QueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/types';
import {
  conversationNeedsMessageWarm,
  messagesQueryKey,
  type MessagesInfiniteData,
  type MessagesPage,
} from '@/utils/chatMessageCache';

const WARM_CONCURRENCY = 3;

type FetchLatestPage = (conversationId: string) => Promise<MessagesPage>;

const getNextPageParam = (lastPage: MessagesPage) => {
  if (!lastPage.hasMore || lastPage.messages.length === 0) return undefined;
  return lastPage.messages[0]._id;
};

/**
 * Prefetch the latest message page for conversations missing from cache
 * (or whose lastMessage is not in cache). Caps concurrency to avoid login bursts.
 */
export async function warmConversationMessagesCache(
  queryClient: QueryClient,
  conversations: Conversation[],
  organizationId: string | undefined | null,
  fetchLatestPage: FetchLatestPage,
): Promise<void> {
  if (!conversations.length) return;

  const pending = conversations.filter((conv) => {
    const cached = queryClient.getQueryData<MessagesInfiniteData>(
      messagesQueryKey(conv._id, organizationId),
    );
    return conversationNeedsMessageWarm(cached, conv.lastMessage?._id);
  });

  if (!pending.length) return;

  let index = 0;
  const workers = Array.from({ length: Math.min(WARM_CONCURRENCY, pending.length) }, async () => {
    while (index < pending.length) {
      const conv = pending[index++];
      try {
        const queryKey = messagesQueryKey(conv._id, organizationId);
        // fetchInfiniteQuery overwrites socket stubs even when staleTime is Infinity.
        await queryClient.fetchInfiniteQuery({
          queryKey,
          queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
            if (pageParam) {
              // Warm only the latest page; older history loads on scroll.
              return { messages: [], hasMore: false } satisfies MessagesPage;
            }
            return fetchLatestPage(conv._id);
          },
          initialPageParam: undefined as string | undefined,
          getNextPageParam,
          staleTime: 0,
          pages: 1,
        });
      } catch {
        // Best-effort warm; opening the chat can still fetch.
      }
    }
  });

  await Promise.all(workers);
}
