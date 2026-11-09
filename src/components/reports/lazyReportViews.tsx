import { lazyRetry } from '@/utils/lazyRetry';

export const AttendanceReportView = lazyRetry(() =>
  import('./AttendanceReportView').then((module) => ({ default: module.AttendanceReportView })),
);

export const CombinedKpiView = lazyRetry(() =>
  import('./CombinedKpiView').then((module) => ({ default: module.CombinedKpiView })),
);

export const KpiPerformanceView = lazyRetry(() =>
  import('./KpiPerformanceView').then((module) => ({ default: module.KpiPerformanceView })),
);

export const TeamOverviewView = lazyRetry(() =>
  import('./TeamOverviewView').then((module) => ({ default: module.TeamOverviewView })),
);
