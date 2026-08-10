import { SALES_KPI_MANUAL_TARGET_METRICS, WEEKDAY_SHORT_LABELS } from '@/lib/constants';
import type { GroupedSalesKpis, SalesKpiEntry, SalesKpiMetric, SalesKpiTargetMode } from '@/types';

/**
 * Mirrors the backend's SALES_KPI_DEFAULT_TARGET_MODE: only new_prospects is
 * counted from a number the admin types in, the rest snapshot the pipeline.
 */
export const defaultTargetModeForMetric = (metric: SalesKpiMetric): SalesKpiTargetMode =>
  SALES_KPI_MANUAL_TARGET_METRICS.includes(metric) ? 'manual' : 'auto_snapshot';

/** A manual target is the only case where a target input should be shown or sent. */
export const isManualTarget = (targetMode?: SalesKpiTargetMode) => targetMode === 'manual';

/** 0 = Sunday … 6 = Saturday. */
export const formatWeekdays = (days: number[] = []) =>
  days.length === 0
    ? 'No days'
    : [...days].sort((a, b) => a - b).map((d) => WEEKDAY_SHORT_LABELS[d] ?? d).join(', ');

/**
 * Defensive client filter mirroring backend visibility:
 * show when periodStart is unset/null, or periodStart <= now.
 */
export const hasPeriodStarted = (periodStart?: string | null, now = new Date()): boolean => {
  if (!periodStart) return true;
  return new Date(periodStart).getTime() <= now.getTime();
};

export const filterStartedSalesKpis = (grouped: GroupedSalesKpis, now = new Date()): GroupedSalesKpis => {
  const filter = (entries: SalesKpiEntry[]) =>
    entries.filter((entry) => hasPeriodStarted(entry.periodStart, now));
  const active = filter(grouped.active);
  const overdue = filter(grouped.overdue);
  const incomplete = filter(grouped.incomplete);
  const done = filter(grouped.done);
  return {
    active,
    overdue,
    incomplete,
    done,
    counts: {
      active: active.length,
      overdue: overdue.length,
      incomplete: incomplete.length,
      done: done.length,
    },
  };
};