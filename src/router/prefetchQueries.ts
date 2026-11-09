import { queryClient } from '@/lib/queryClient';
import { prefetchSalesPipelineStats } from '@/hooks/api/useConnections';
import { prefetchLeadsFirstPage } from '@/hooks/api/useLeads';
import { prefetchMeetings } from '@/hooks/api/useMeetings';
import { prefetchProjects } from '@/hooks/api/useProjects';

export const prefetchPrimaryQuery = (path: string) => {
  if (path === '/projects') return prefetchProjects(queryClient);
  if (path === '/sales') {
    return Promise.all([prefetchLeadsFirstPage(queryClient), prefetchSalesPipelineStats(queryClient)]);
  }
  if (path === '/meetings') return prefetchMeetings(queryClient);
  return undefined;
};
