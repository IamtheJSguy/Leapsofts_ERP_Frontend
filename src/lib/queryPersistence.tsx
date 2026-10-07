import { useMemo, type ReactNode } from 'react';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';

export const QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;

export const queryCacheKey = (userId: string) => `leapsoft-query-cache:${userId}`;

const idbStorage = {
  getItem: async (key: string) => (await get<string>(key)) ?? null,
  setItem: async (key: string, value: string) => {
    await set(key, value);
  },
  removeItem: async (key: string) => {
    await del(key);
  },
};

let persistQueries = true;

export async function discardQueryCacheForSessionChange(userIds: Array<string | undefined | null>) {
  persistQueries = false;
  try {
    const unique = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
    await Promise.all(unique.map((userId) => del(queryCacheKey(userId))));
    queryClient.clear();
  } finally {
    persistQueries = true;
  }
}

export function QueryCacheProvider({ children }: { children: ReactNode }) {
  const userId = useAuthStore((s) => s.user?._id ?? null);
  const persister = useMemo(
    () =>
      createAsyncStoragePersister({
        storage: idbStorage,
        key: userId ? queryCacheKey(userId) : 'leapsoft-query-cache:signed-out',
      }),
    [userId],
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: QUERY_CACHE_MAX_AGE_MS,
        buster: userId ?? 'signed-out',
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            persistQueries &&
            Boolean(useAuthStore.getState().user?._id) &&
            defaultShouldDehydrateQuery(query as any),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
