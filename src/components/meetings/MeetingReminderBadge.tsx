import { Chip, useTheme } from '@mui/material';
import { differenceInHours, differenceInMinutes, isPast } from 'date-fns';
import { tokens } from '@/styles/tokens';

interface MeetingReminderBadgeProps {
  scheduledAt: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
}

export const MeetingReminderBadge = ({ scheduledAt, status }: MeetingReminderBadgeProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const date = new Date(scheduledAt);

  if (status === 'cancelled') {
    return (
      <Chip
        label="Cancelled"
        size="small"
        sx={{
          bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.15)' : 'rgba(196, 69, 69, 0.08)',
          color: tokens.semantic.error,
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(196, 69, 69, 0.3)' : 'rgba(196, 69, 69, 0.2)',
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      />
    );
  }

  if (isPast(date)) {
    return (
      <Chip
        label="Past"
        size="small"
        sx={{
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      />
    );
  }

  const hours = differenceInHours(date, new Date());
  const minutes = differenceInMinutes(date, new Date()) % 60;

  const text = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  
  let textColor: string = tokens.brand.primary;
  let borderColor: string = 'rgba(93, 26, 137, 0.2)';
  let bgColor: string = tokens.brand.primary50;

  if (isDarkMode) {
    textColor = tokens.brand.primaryLight;
    borderColor = 'rgba(123, 61, 168, 0.3)';
    bgColor = 'rgba(123, 61, 168, 0.12)';
  }

  if (hours < 1) {
    // Error
    textColor = tokens.semantic.error;
    borderColor = 'rgba(196, 69, 69, 0.3)';
    bgColor = tokens.semantic.errorBg;
    if (isDarkMode) {
      textColor = '#FF7272';
      borderColor = 'rgba(255, 114, 114, 0.3)';
      bgColor = 'rgba(229, 115, 115, 0.12)';
    }
  } else if (hours < 24) {
    // Warning
    textColor = tokens.semantic.warning;
    borderColor = 'rgba(184, 134, 11, 0.3)';
    bgColor = tokens.semantic.warningBg;
    if (isDarkMode) {
      textColor = '#FFA726';
      borderColor = 'rgba(255, 167, 38, 0.3)';
      bgColor = 'rgba(255, 183, 77, 0.12)';
    }
  }

  return (
    <Chip
      label={`Starts in ${text}`}
      size="small"
      aria-label={`Meeting in ${hours} hours ${minutes} minutes`}
      sx={{
        bgcolor: bgColor,
        color: textColor,
        border: '1px solid',
        borderColor: borderColor,
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
    />
  );
};
