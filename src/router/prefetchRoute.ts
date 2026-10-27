import { routeLoaders } from '@/router/lazy-pages';

const warmedChunks = new Set<string>();

/** Warm the route chunk on hover, then its first list query in a separate chunk. */
export const prefetchNavRoute = (path: string) => {
  const loader = routeLoaders[path];
  if (!loader || warmedChunks.has(path)) return;
  warmedChunks.add(path);
  void loader().catch(() => {
    warmedChunks.delete(path);
  });
  void import('@/router/prefetchQueries')
    .then((module) => {
      void module.prefetchPrimaryQuery(path);
    })
    .catch(() => {
      warmedChunks.delete(path);
    });
};
