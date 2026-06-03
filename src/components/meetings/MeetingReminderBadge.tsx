import { Chip } from '@mui/material';
import { differenceInHours, differenceInMinutes, isPast } from 'date-fns';

interface MeetingReminderBadgeProps {
  scheduledAt: string;
}

export const MeetingReminderBadge = ({ scheduledAt }: MeetingReminderBadgeProps) => {
  const date = new Date(scheduledAt);
  if (isPast(date)) {
    return <Chip label="Past" size="small" />;
  }

  const hours = differenceInHours(date, new Date());
  const minutes = differenceInMinutes(date, new Date()) % 60;

  let color: 'default' | 'warning' | 'error' = 'default';
  if (hours < 1) color = 'error';
  else if (hours < 24) color = 'warning';

  return (
    <Chip
      label={hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
      size="small"
      color={color}
      aria-label={`Meeting in ${hours} hours ${minutes} minutes`}
    />
  );
};
