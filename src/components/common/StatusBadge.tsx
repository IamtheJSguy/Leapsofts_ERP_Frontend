import { Chip, Box } from '@mui/material';
import {
  getConnectionColors,
  getMessageColors,
  formatStatusLabel,
} from '@/utils/colorUtils';
import type { ConnectionStatus, MessageStatus } from '@/types';

interface StatusBadgeProps {
  status: ConnectionStatus | MessageStatus | string;
  type?: 'connection' | 'message';
}

export const StatusBadge = ({ status, type = 'connection' }: StatusBadgeProps) => {
  const { color, bg } =
    type === 'message'
      ? getMessageColors(status as MessageStatus)
      : getConnectionColors(status as ConnectionStatus);

  const label = formatStatusLabel(status);

  return (
    <Chip
      label={label}
      size="small"
      icon={
        <Box
          component="span"
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: color,
            ml: 0.5,
          }}
        />
      }
      sx={{
        bgcolor: bg,
        color,
        fontWeight: 600,
        fontSize: 12,
        height: 28,
        border: `1px solid ${color}22`,
        '& .MuiChip-icon': { ml: 1, mr: -0.5 },
        '& .MuiChip-label': { px: 1.25 },
      }}
      aria-label={`Status: ${label}`}
    />
  );
};
