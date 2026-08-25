import { format } from 'date-fns';
import { SALES_KPI_METRIC, SALES_KPI_METRIC_LABELS } from '@/lib/constants';
import { formatDateToString, parseLocalDate, workingDaysInRange } from '@/lib/kpiPeriod';
import type { SalesKpiEntry, SalesKpiStatus } from '@/types';

export type TaskDisplay = {
  statusLabel: string;
  isCompleted: boolean;
  isOverdue: boolean;
  isCompletedLate: boolean;
};

export type MemberDailyKpiEntry = {
  _id: string;
  kpiId?: string | { _id?: string; name?: string };
  assignmentItemId?: string;
  kpiName?: string;
  date?: string;
  periodStart?: string;
  periodEnd?: string;
  scheduleMode?: 'per_day' | 'span';
  kanbanCardId?: unknown;
  actualValue?: number | null;
  targetValue?: number | null;
  isCompleted?: boolean;
  completedAt?: string | null;
};

export type WeekTableCell = {
  done: number;
  target: number;
  display: TaskDisplay;
  colSpan: number;
};

export type WeekTableRow = {
  id: string;
  name: string;
  kind: 'sales' | 'standalone';
  cells: Array<WeekTableCell | 'covered' | null>;
  totalDone: number;
  totalTarget: number;
  totalDisplay: TaskDisplay;
};

export type WeekTableModel = {
  workingDays: string[];
  columnLabels: string[];
  rows: WeekTableRow[];
};

/** Same as KpiDetailCard `hasTarget`: skip numbers unless a positive target is set. */
export const kpiHasTarget = (target?: number | null) => target != null && target > 0;

/** Hide 0/0 and other no-target KPIs — return null so the UI can show status only. */
export const formatDoneTargetPair = (done?: number | null, target?: number | null): string | null => {
  if (!kpiHasTarget(target)) return null;
  return `${done ?? 0} / ${target}`;
};

export const cellStatusTooltip = (
  statusLabel: string,
  done?: number | null,
  target?: number | null,
) => {
  const pair = formatDoneTargetPair(done, target);
  return pair ? `${statusLabel} · ${pair}` : statusLabel;
};

const SALES_METRIC_ORDER = [
  SALES_KPI_METRIC.NEW_PROSPECTS,
  SALES_KPI_METRIC.MESSAGES_SENT,
  SALES_KPI_METRIC.FOLLOW_UPS,
];

const isSalesDone = (status: SalesKpiStatus) =>
  status === 'completed_on_time' || status === 'completed_late';

export const periodHasEnded = (periodEnd?: string | null) =>
  !!periodEnd && new Date(periodEnd).getTime() < Date.now();

export const completedAfterDeadline = (completedAt?: string | null, periodEnd?: string | null) =>
  !!completedAt && !!periodEnd && new Date(completedAt).getTime() > new Date(periodEnd).getTime();

const hasPartialProgress = (actual?: number | null, target?: number | null) => {
  const value = actual ?? 0;
  return value > 0 && (target == null || value < target);
};

export const salesTaskDisplay = (entry: {
  status: SalesKpiStatus;
  currentValue?: number | null;
  targetValue?: number | null;
  periodEnd?: string | null;
}): TaskDisplay => {
  const done = isSalesDone(entry.status);
  const completedLate = entry.status === 'completed_late';
  const partial =
    !done && (entry.status === 'partial' || hasPartialProgress(entry.currentValue, entry.targetValue));
  const overdue = !done && !partial && (entry.status === 'missed' || periodHasEnded(entry.periodEnd));

  let statusLabel: string;
  if (completedLate) statusLabel = 'Completed late';
  else if (entry.status === 'completed_on_time') statusLabel = 'Completed';
  else if (overdue) statusLabel = 'Overdue';
  else statusLabel = 'Incomplete';

  return { statusLabel, isCompleted: done, isOverdue: overdue, isCompletedLate: completedLate };
};

export const dailyTaskDisplay = (entry: {
  isCompleted?: boolean;
  periodEnd?: string;
  completedAt?: string | null;
  actualValue?: number | null;
  targetValue?: number | null;
}): TaskDisplay => {
  const done = !!entry.isCompleted;
  const completedLate = done && completedAfterDeadline(entry.completedAt, entry.periodEnd);
  const partial = !done && hasPartialProgress(entry.actualValue, entry.targetValue);
  const overdue = !done && !partial && periodHasEnded(entry.periodEnd);

  let statusLabel: string;
  if (completedLate) statusLabel = 'Completed late';
  else if (done) statusLabel = 'Completed';
  else if (overdue) statusLabel = 'Overdue';
  else statusLabel = 'Incomplete';

  return { statusLabel, isCompleted: done, isOverdue: overdue, isCompletedLate: completedLate };
};

export const toLocalDateKey = (value?: string | null): string | null => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const slice = value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : null;
  }
  return formatDateToString(d);
};

export const weekdayHeader = (dateStr: string) => format(parseLocalDate(dateStr), 'EEE d');

export const weekWorkingTitle = (workingDays: string[]) => {
  if (workingDays.length === 0) return '';
  if (workingDays.length === 1) return weekdayHeader(workingDays[0]);
  return `${weekdayHeader(workingDays[0])} – ${weekdayHeader(workingDays[workingDays.length - 1])}`;
};

const datesInclusive = (start: string, end: string): string[] => {
  const out: string[] = [];
  let cursor = parseLocalDate(start);
  const last = parseLocalDate(end);
  while (cursor <= last) {
    out.push(formatDateToString(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }
  return out;
};

const entryDaySpan = (opts: {
  scheduleMode?: 'per_day' | 'span';
  periodStart?: string | null;
  periodEnd?: string | null;
  date?: string | null;
}): string[] => {
  const start = toLocalDateKey(opts.periodStart) || toLocalDateKey(opts.date);
  if (!start) return [];
  if (opts.scheduleMode === 'span') {
    const end = toLocalDateKey(opts.periodEnd) || start;
    return datesInclusive(start, end < start ? start : end);
  }
  return [start];
};

export const entryOverlapsRange = (
  entry: {
    scheduleMode?: 'per_day' | 'span';
    periodStart?: string | null;
    periodEnd?: string | null;
    date?: string | null;
  },
  startDate: string,
  endDate: string,
) => {
  const days = entryDaySpan(entry);
  return days.some((d) => d >= startDate && d <= endDate);
};

const intersectWorkingDays = (entryDays: string[], workingDays: string[]) =>
  workingDays.filter((d) => entryDays.includes(d));

type NumericContribution = {
  done: number;
  target: number;
  salesStatus?: SalesKpiStatus;
  periodEnd?: string | null;
  completedAt?: string | null;
  isCompleted?: boolean;
  kind: 'sales' | 'standalone';
};

const combinedSalesDisplay = (parts: NumericContribution[]): TaskDisplay => {
  const totalDone = parts.reduce((s, p) => s + p.done, 0);
  const totalTarget = parts.reduce((s, p) => s + p.target, 0);
  const statuses = parts.map((p) => p.salesStatus).filter(Boolean) as SalesKpiStatus[];
  const allDone = statuses.length > 0 && statuses.every(isSalesDone);
  if (allDone) {
    const late = statuses.some((s) => s === 'completed_late');
    return {
      statusLabel: late ? 'Completed late' : 'Completed',
      isCompleted: true,
      isOverdue: false,
      isCompletedLate: late,
    };
  }
  return salesTaskDisplay({
    status: statuses.includes('missed')
      ? 'missed'
      : statuses.includes('partial')
        ? 'partial'
        : 'pending',
    currentValue: totalDone,
    targetValue: totalTarget,
    periodEnd: parts.map((p) => p.periodEnd).find(Boolean) ?? null,
  });
};

const combinedDailyDisplay = (parts: NumericContribution[]): TaskDisplay => {
  const totalDone = parts.reduce((s, p) => s + p.done, 0);
  const totalTarget = parts.reduce((s, p) => s + p.target, 0);
  const allDone = parts.every((p) => p.isCompleted);
  const anyLate = parts.some((p) => p.isCompleted && completedAfterDeadline(p.completedAt, p.periodEnd));
  if (allDone && parts.length > 0) {
    return {
      statusLabel: anyLate ? 'Completed late' : 'Completed',
      isCompleted: true,
      isOverdue: false,
      isCompletedLate: anyLate,
    };
  }
  return dailyTaskDisplay({
    isCompleted: false,
    periodEnd: parts.map((p) => p.periodEnd || undefined).find(Boolean),
    completedAt: null,
    actualValue: totalDone,
    targetValue: totalTarget,
  });
};

const combinedDisplay = (parts: NumericContribution[]): TaskDisplay => {
  if (parts.length === 0) {
    return { statusLabel: 'Incomplete', isCompleted: false, isOverdue: false, isCompletedLate: false };
  }
  if (parts[0].kind === 'sales') return combinedSalesDisplay(parts);
  return combinedDailyDisplay(parts);
};

type Segment = {
  startIdx: number;
  endIdx: number;
  parts: NumericContribution[];
};

const paintSegments = (workingDays: string[], segments: Segment[]): WeekTableRow['cells'] => {
  const n = workingDays.length;
  const cells: WeekTableRow['cells'] = Array.from({ length: n }, () => null);

  const sorted = [...segments].sort((a, b) => a.startIdx - b.startIdx || b.endIdx - a.endIdx);
  const merged: Segment[] = [];
  for (const seg of sorted) {
    const overlap = merged.find((m) => !(seg.endIdx < m.startIdx || seg.startIdx > m.endIdx));
    if (overlap) {
      overlap.startIdx = Math.min(overlap.startIdx, seg.startIdx);
      overlap.endIdx = Math.max(overlap.endIdx, seg.endIdx);
      overlap.parts.push(...seg.parts);
    } else {
      merged.push({ ...seg, parts: [...seg.parts] });
    }
  }

  for (const seg of merged) {
    const done = seg.parts.reduce((s, p) => s + p.done, 0);
    const target = seg.parts.reduce((s, p) => s + p.target, 0);
    const colSpan = seg.endIdx - seg.startIdx + 1;
    cells[seg.startIdx] = {
      done,
      target,
      display: combinedDisplay(seg.parts),
      colSpan,
    };
    for (let i = seg.startIdx + 1; i <= seg.endIdx; i++) {
      cells[i] = 'covered';
    }
  }
  return cells;
};

const uniqueEntryTotal = (segments: Segment[]) => {
  const parts = segments.flatMap((s) => s.parts);
  return {
    totalDone: parts.reduce((s, p) => s + p.done, 0),
    totalTarget: parts.reduce((s, p) => s + p.target, 0),
    totalDisplay: combinedDisplay(parts),
  };
};

const salesToSegment = (entry: SalesKpiEntry, workingDays: string[]): Segment | null => {
  const covered = intersectWorkingDays(
    entryDaySpan({
      scheduleMode: entry.scheduleMode,
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
    }),
    workingDays,
  );
  if (covered.length === 0) return null;
  const startIdx = workingDays.indexOf(covered[0]);
  const endIdx = workingDays.indexOf(covered[covered.length - 1]);
  return {
    startIdx,
    endIdx,
    parts: [
      {
        done: entry.currentValue ?? 0,
        target: entry.targetValue ?? 0,
        salesStatus: entry.status,
        periodEnd: entry.periodEnd,
        completedAt: entry.completedAt,
        kind: 'sales',
      },
    ],
  };
};

const dailyToSegment = (entry: MemberDailyKpiEntry, workingDays: string[]): Segment | null => {
  const covered = intersectWorkingDays(
    entryDaySpan({
      scheduleMode: entry.scheduleMode,
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
      date: entry.date,
    }),
    workingDays,
  );
  if (covered.length === 0) return null;
  const startIdx = workingDays.indexOf(covered[0]);
  const endIdx = workingDays.indexOf(covered[covered.length - 1]);
  return {
    startIdx,
    endIdx,
    parts: [
      {
        done: entry.actualValue ?? 0,
        target: entry.targetValue ?? 0,
        periodEnd: entry.periodEnd,
        completedAt: entry.completedAt,
        isCompleted: entry.isCompleted,
        kind: 'standalone',
      },
    ],
  };
};

const kpiIdentity = (entry: MemberDailyKpiEntry) => {
  const kpiId =
    typeof entry.kpiId === 'string' ? entry.kpiId : entry.kpiId?._id || '';
  const itemId = entry.assignmentItemId || '';
  const name = entry.kpiName || (typeof entry.kpiId === 'object' ? entry.kpiId?.name : '') || 'KPI';
  return { key: `${kpiId}|${itemId}|${name}`, name };
};

export const buildWeekTableModel = (opts: {
  startDate: string;
  endDate: string;
  salesEntries: SalesKpiEntry[];
  standaloneEntries: MemberDailyKpiEntry[];
}): WeekTableModel => {
  const workingDays = workingDaysInRange(opts.startDate, opts.endDate);
  const columnLabels = workingDays.map(weekdayHeader);

  const rows: WeekTableRow[] = [];

  const salesByMetric = new Map<string, SalesKpiEntry[]>();
  for (const entry of opts.salesEntries) {
    const list = salesByMetric.get(entry.metric) || [];
    list.push(entry);
    salesByMetric.set(entry.metric, list);
  }

  const metricKeys = [
    ...SALES_METRIC_ORDER.filter((m) => salesByMetric.has(m)),
    ...[...salesByMetric.keys()].filter((m) => !(SALES_METRIC_ORDER as readonly string[]).includes(m)),
  ];

  for (const metric of metricKeys) {
    const entries = salesByMetric.get(metric) || [];
    const segments = entries
      .map((e) => salesToSegment(e, workingDays))
      .filter((s): s is Segment => s != null);
    if (segments.length === 0) continue;
    const totals = uniqueEntryTotal(segments);
    rows.push({
      id: `sales-${metric}`,
      name: SALES_KPI_METRIC_LABELS[metric] ?? metric,
      kind: 'sales',
      cells: paintSegments(workingDays, segments),
      ...totals,
    });
  }

  const standaloneByKey = new Map<string, { name: string; entries: MemberDailyKpiEntry[] }>();
  for (const entry of opts.standaloneEntries) {
    const { key, name } = kpiIdentity(entry);
    const group = standaloneByKey.get(key) || { name, entries: [] };
    group.entries.push(entry);
    standaloneByKey.set(key, group);
  }

  for (const [key, group] of standaloneByKey) {
    const segments = group.entries
      .map((e) => dailyToSegment(e, workingDays))
      .filter((s): s is Segment => s != null);
    if (segments.length === 0) continue;
    const totals = uniqueEntryTotal(segments);
    rows.push({
      id: `standalone-${key}`,
      name: group.name,
      kind: 'standalone',
      cells: paintSegments(workingDays, segments),
      ...totals,
    });
  }

  return { workingDays, columnLabels, rows };
};

export const isKanbanDailyEntry = (entry: { kanbanCardId?: unknown }) => Boolean(entry.kanbanCardId);
