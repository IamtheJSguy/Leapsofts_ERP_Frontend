import { useDashboard } from '@/hooks/api/useDashboard';
import { useConnectionStats } from '@/hooks/api/useConnections';
import { useKPIRecords } from '@/hooks/api/useKPIs';

export const useDashboardStats = () => {
  const dashboard = useDashboard();
  const connectionStats = useConnectionStats();
  const kpiRecords = useKPIRecords();

  return {
    dashboard: dashboard.data,
    connectionStats: connectionStats.data,
    kpiRecords: kpiRecords.data,
    isLoading: dashboard.isLoading || connectionStats.isLoading,
  };
};
