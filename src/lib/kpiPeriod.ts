import { endOfWeek, format, startOfWeek } from 'date-fns';

export type PeriodMode = 'day' | 'week' | 'range';

export const parseLocalDate = (str: string) => {
  const parts = str.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};

export const formatDateToString = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Calendar week Sun–Sat, matching GlassDatePicker / date-fns default. */
export const weekBounds = (anchor: string) => {
  const d = parseLocalDate(anchor);
  return {
    startDate: formatDateToString(startOfWeek(d)),
    endDate: formatDateToString(endOfWeek(d)),
  };
};

export const resolvePeriod = (
  mode: PeriodMode,
  date: string,
  rangeEnd: string,
): { startDate: string; endDate: string } => {
  if (mode === 'week') return weekBounds(date);
  if (mode === 'range') {
    const end = rangeEnd && rangeEnd >= date ? rangeEnd : date;
    return { startDate: date, endDate: end };
  }
  return { startDate: date, endDate: date };
};

export const formatPeriodLabel = (mode: PeriodMode, startDate: string, endDate: string) => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (mode === 'day' || startDate === endDate) {
    return format(start, 'MMM dd, yyyy');
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM dd')} – ${format(end, 'MMM dd, yyyy')}`;
  }
  return `${format(start, 'MMM dd, yyyy')} – ${format(end, 'MMM dd, yyyy')}`;
};

export const buildMemberKpiDetailSearch = (opts: {
  mode: PeriodMode;
  date: string;
  rangeEnd: string;
}) => {
  const period = resolvePeriod(opts.mode, opts.date, opts.rangeEnd);
  const params = new URLSearchParams({
    mode: opts.mode,
    startDate: opts.date,
    endDate: period.endDate,
  });
  if (opts.mode === 'range') {
    params.set('rangeEnd', opts.rangeEnd || period.endDate);
  }
  return params.toString();
};

export const isPeriodMode = (value: string | null): value is PeriodMode =>
  value === 'day' || value === 'week' || value === 'range';

export type WeekSlice = { startDate: string; endDate: string };

const addCalendarDays = (d: Date, days: number) => {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return next;
};

/** Split an inclusive date range into Sun–Sat calendar weeks, clipped to the range. */
export const splitRangeIntoWeeks = (startDate: string, endDate: string): WeekSlice[] => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (end < start) return [];

  const slices: WeekSlice[] = [];
  let cursor = start;
  while (cursor <= end) {
    const bounds = weekBounds(formatDateToString(cursor));
    const sliceStart = startDate > bounds.startDate ? startDate : bounds.startDate;
    const sliceEnd = endDate < bounds.endDate ? endDate : bounds.endDate;
    slices.push({ startDate: sliceStart, endDate: sliceEnd });
    cursor = addCalendarDays(parseLocalDate(bounds.endDate), 1);
  }
  return slices;
};

const isWeekend = (dateStr: string) => {
  const day = parseLocalDate(dateStr).getDay();
  return day === 0 || day === 6;
};

/** Monday–Friday dates inside an inclusive slice. Saturday and Sunday are omitted. */
export const workingDaysInRange = (startDate: string, endDate: string): string[] => {
  const days: string[] = [];
  let cursor = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  while (cursor <= end) {
    const key = formatDateToString(cursor);
    if (!isWeekend(key)) days.push(key);
    cursor = addCalendarDays(cursor, 1);
  }
  return days;
};
