import { format, parseISO } from 'date-fns';

export const formatDate = (date: string | Date, pattern = 'MMM d, yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
};

export const formatDateTime = (date: string | Date): string =>
  formatDate(date, 'MMM d, yyyy h:mm a');

/**
 * True when an instant has a clock time worth showing on KPI cards
 * (hides midnight and end-of-day defaults like 23:59).
 */
export const hasDisplayableClockTime = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return false;
  const utcMidnight =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0;
  if (utcMidnight) return false;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  if (hours === 0 && minutes === 0) return false;
  if (hours === 23 && minutes === 59) return false;
  return true;
};

/**
 * Formats a KPI due instant. Matches SalesKpiEntryCard when a clock time is shown
 * ("Aug 10, 5:00 PM"). Use month: 'long' + separator: 'dot' for deadline rows
 * ("August 10 · 5:00 PM").
 *
 * Pass `includeTime: true` for scheduled periodEnd values with a real endTime;
 * omit or pass false for date-only / end-of-day defaults.
 */
export const formatKpiDueDate = (
  date: string | Date,
  opts?: { month?: 'short' | 'long'; separator?: 'comma' | 'dot'; includeTime?: boolean },
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const month = opts?.month ?? 'short';
  const showTime = opts?.includeTime === true;
  if (!showTime) {
    return d.toLocaleDateString('en-US', { month, day: 'numeric' });
  }
  if (opts?.separator === 'dot') {
    const datePart = d.toLocaleDateString('en-US', { month, day: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${datePart} · ${timePart}`;
  }
  return d.toLocaleString('en-US', {
    month,
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US').format(value);

export const formatPercent = (value: number, decimals = 1): string =>
  `${value.toFixed(decimals)}%`;

export const getDisplayName = (
  user?: { firstName?: string; lastName?: string; email?: string } | null,
): string => {
  if (!user) return 'Unknown';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.email || 'Unknown';
};

/** Full name for display / form binding: prefer prospectName, else first + last. */
export const composeProspectName = (lead: {
  firstName?: string;
  lastName?: string;
  prospectName?: string;
}): string => {
  if (lead.prospectName?.trim()) return lead.prospectName.trim();
  return [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim();
};

/**
 * Split a full name at the first space: first word → firstName, remainder → lastName.
 * Keeps the raw input as prospectName so the field can accept spaces while typing.
 * Callers should trim prospectName on submit.
 */
export const splitProspectName = (
  fullName: string,
): { firstName: string; lastName: string; prospectName: string } => {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: '', lastName: '', prospectName: fullName };
  }
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '', prospectName: fullName };
  }
  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
    prospectName: fullName,
  };
};

export const getLeadDisplayName = (lead: {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  prospectName?: string;
}): string => {
  const name = composeProspectName(lead);
  return name || lead.email || lead.company || 'Unnamed Lead';
};

export const formatTime12Hour = (timeStr?: string): string => {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  if (!hourStr || !minuteStr) return timeStr;
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour.toString().padStart(2, '0')}:${minuteStr} ${ampm}`;
};

export const formatLastSeen = (lastSeenAt?: string | null): string => {
  if (!lastSeenAt) return 'Offline';
  try {
    const date = typeof lastSeenAt === 'string' ? parseISO(lastSeenAt) : lastSeenAt;
    const diffMs = Date.now() - date.getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return 'Offline';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Last seen just now';
    if (minutes < 60) return `Last seen ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Last seen ${hours}h ago`;
    return `Last seen ${format(date, 'MMM d')}`;
  } catch {
    return 'Offline';
  }
};

export const getPresenceLabel = (
  status: 'online' | 'away' | 'offline' | undefined,
  lastSeenAt?: string | null,
): string => {
  if (status === 'online') return 'Active now';
  if (status === 'away') return 'Away';
  return formatLastSeen(lastSeenAt);
};
