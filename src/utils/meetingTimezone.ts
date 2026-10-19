import { endOfDay, startOfDay } from 'date-fns';

/** Browser IANA timezone or fallback. */
export const getBrowserTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const getDefaultMeetingTimeZone = (user?: {
  timezone?: string | null;
  timeZone?: string | null;
  organization?: { timezone?: string | null } | null;
}): string =>
  user?.timezone || user?.timeZone || user?.organization?.timezone || getBrowserTimeZone();

const WALL_CLOCK_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const getZonedParts = (date: Date, timeZone: string) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour),
    minute: Number(parts.minute),
  };
};

/** Wall clock in `timeZone` → UTC ISO string for API. */
export const wallClockToUtcIso = (localDateTime: string, timeZone: string): string => {
  const match = WALL_CLOCK_RE.exec(localDateTime.trim());
  if (!match) {
    return new Date(localDateTime).toISOString();
  }
  const target = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };

  let utcMs = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, 0);
  for (let i = 0; i < 6; i++) {
    const parts = getZonedParts(new Date(utcMs), timeZone);
    if (
      parts.year === target.year &&
      parts.month === target.month &&
      parts.day === target.day &&
      parts.hour === target.hour &&
      parts.minute === target.minute
    ) {
      return new Date(utcMs).toISOString();
    }
    const partsAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    const targetAsUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
    utcMs += targetAsUtc - partsAsUtc;
  }
  return new Date(utcMs).toISOString();
};

/** UTC instant → wall clock string for pickers in `timeZone`. */
export const utcToWallClock = (iso: string | Date, timeZone: string): string => {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const p = getZonedParts(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
};

export const formatMeetingInstant = (
  iso: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
): string => {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(date);
};

/**
 * End time for react-big-calendar. Events that cross local midnight are treated as
 * multi-day and render in the all-day row (top of the column); cap to end of start day.
 */
export const getCalendarEventEnd = (start: Date, durationMinutes?: number): Date => {
  const mins = durationMinutes ?? 30;
  const durationMs = Math.max(15, mins) * 60_000;
  let end = new Date(start.getTime() + durationMs);

  if (Number.isNaN(start.getTime())) {
    return new Date(Date.now() + 30 * 60_000);
  }
  if (Number.isNaN(end.getTime()) || end <= start) {
    end = new Date(start.getTime() + 30 * 60_000);
  }
  if (startOfDay(end).getTime() > startOfDay(start).getTime()) {
    return endOfDay(start);
  }
  return end;
};

export const listCommonTimeZones = (): string[] => {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
      .supportedValuesOf?.('timeZone');
    if (supported?.length) return supported;
  } catch {
    // ignore
  }
  return [
    'Asia/Karachi',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'UTC',
    getBrowserTimeZone(),
  ];
};
