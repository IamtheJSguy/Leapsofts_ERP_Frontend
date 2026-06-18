import { format, parseISO } from 'date-fns';

export const formatDate = (date: string | Date, pattern = 'MMM d, yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
};

export const formatDateTime = (date: string | Date): string =>
  formatDate(date, 'MMM d, yyyy h:mm a');

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

export const getLeadDisplayName = (lead: {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  prospectName?: string;
}): string => {
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ');
  return name || lead.prospectName || lead.email || lead.company || 'Unnamed Lead';
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
