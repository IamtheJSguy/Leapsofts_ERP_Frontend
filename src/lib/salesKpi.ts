import { SALES_KPI_MANUAL_TARGET_METRICS, WEEKDAY_SHORT_LABELS } from '@/lib/constants';
import type { SalesKpiMetric, SalesKpiTargetMode } from '@/types';

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
