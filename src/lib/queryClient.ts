import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 100,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      structuralSharing: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
