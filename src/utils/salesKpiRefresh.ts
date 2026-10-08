import type { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';

export const refreshSalesKpiQueries = (client: QueryClient): void => {
  for (const key of ['salesKpis', 'salesKpiSummary', 'dashboard', 'salesPipelineStats', 'dailyTasks']) {
    void client.invalidateQueries({ queryKey: [key] });
  }
};

// Coalesce rapid edits; avoid refreshing a different session or organization.
let fallback: ReturnType<typeof setTimeout> | undefined;
export const scheduleSalesKpiRefresh = (client: QueryClient): void => {
  if (fallback) clearTimeout(fallback);
  const user = useAuthStore.getState().user;
  fallback = setTimeout(() => {
    fallback = undefined;
    const current = useAuthStore.getState();
    if (current.isAuthenticated && current.user?._id === user?._id && current.user?.organizationId === user?.organizationId) {
      refreshSalesKpiQueries(client);
    }
  }, 5000);
};
