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
