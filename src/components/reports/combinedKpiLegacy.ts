import type { CombinedKpiMetrics, CombinedKpiSection, KpiPerformanceMetrics } from '@/types';

const emptySection = (): CombinedKpiSection => ({
  assigned: 0,
  completed: 0,
  overdue: 0,
  completionRate: 0,
  rows: [],
  byName: [],
  dailyTrend: [],
});

export const fromLegacyKpiPerformance = (legacy: KpiPerformanceMetrics): CombinedKpiMetrics => ({
  headlines: {
    assigned: legacy.totalAssigned,
    completed: legacy.completed,
    overdue: legacy.missed,
    completionRate: legacy.completionRate,
    salesAttainment: 0,
    simpleCompletionRate: legacy.completionRate,
    kanbanCompletionRate: 0,
    completedLate: 0,
  },
  simple: {
    assigned: legacy.totalAssigned,
    completed: legacy.completed,
    overdue: legacy.missed,
    completionRate: legacy.completionRate,
    rows: (legacy.byKpi ?? []).map((row) => ({
      name: row.kpiName,
      assigned: row.entriesTotal,
      completed: row.entriesCompleted,
      overdue: 0,
      completionRate: row.entriesTotal > 0 ? Math.round((row.entriesCompleted / row.entriesTotal) * 100) : 0,
      target: row.target,
      actual: row.actual,
      attainmentRate: row.attainmentRate,
    })),
    byName: (legacy.byKpi ?? []).map((row) => ({
      name: row.kpiName,
      assigned: row.entriesTotal,
      completed: row.entriesCompleted,
      overdue: 0,
      completionRate: row.entriesTotal > 0 ? Math.round((row.entriesCompleted / row.entriesTotal) * 100) : 0,
      target: row.target,
      actual: row.actual,
      attainmentRate: row.attainmentRate,
    })),
    dailyTrend: legacy.dailyTrend,
  },
  kanban: emptySection(),
  sales: emptySection(),
});
