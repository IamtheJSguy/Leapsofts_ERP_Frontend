import { SALES_KPI_MANUAL_TARGET_METRICS, WEEKDAY_SHORT_LABELS } from '@/lib/constants';
import type {
  GroupedSalesKpis,
  PriorityBucket,
  SalesKpiEntry,
  SalesKpiMetric,
  SalesKpiTargetMode,
  SectionCounts,
} from '@/types';

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

const filterPriorityBucket = (
  bucket: PriorityBucket<SalesKpiEntry> | undefined,
  now: Date,
): PriorityBucket<SalesKpiEntry> => ({
  low: (bucket?.low ?? []).filter((entry) => hasPeriodStarted(entry.periodStart, now)),
  medium: (bucket?.medium ?? []).filter((entry) => hasPeriodStarted(entry.periodStart, now)),
  high: (bucket?.high ?? []).filter((entry) => hasPeriodStarted(entry.periodStart, now)),
  urgent: (bucket?.urgent ?? []).filter((entry) => hasPeriodStarted(entry.periodStart, now)),
});

const countsFromBucket = (bucket: PriorityBucket<SalesKpiEntry>): SectionCounts => {
  const low = bucket.low.length;
  const medium = bucket.medium.length;
  const high = bucket.high.length;
  const urgent = bucket.urgent.length;
  return { low, medium, high, urgent, total: low + medium + high + urgent };
};

export const filterStartedSalesKpis = (grouped: GroupedSalesKpis, now = new Date()): GroupedSalesKpis => {
  const active = filterPriorityBucket(grouped.active, now);
  const overdue = filterPriorityBucket(grouped.overdue, now);
  const incomplete = filterPriorityBucket(grouped.incomplete, now);
  const done = filterPriorityBucket(grouped.done, now);
  return {
    active,
    overdue,
    incomplete,
    done,
    counts: {
      active: countsFromBucket(active),
      overdue: countsFromBucket(overdue),
      incomplete: countsFromBucket(incomplete),
      done: countsFromBucket(done),
    },
  };
};