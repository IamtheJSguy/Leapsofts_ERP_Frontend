import { Chip } from '@mui/material';
import { getPriorityConfig, type KpiPriority } from '@/lib/priorityConfig';

interface PriorityBadgeProps {
  priority?: string;
  size?: 'small' | 'medium';
}

export const PriorityBadge = ({ priority = 'medium', size = 'small' }: PriorityBadgeProps) => {
  const cfg = getPriorityConfig(priority);

  return (
    <Chip
      label={cfg.label}
      size={size}
      sx={{
        bgcolor: cfg.bg,
        color: cfg.dot,
        fontWeight: 700,
        fontSize: size === 'small' ? '0.68rem' : '0.75rem',
        height: size === 'small' ? 22 : 26,
        border: `1px solid ${cfg.border}`,
      }}
    />
  );
};

export type { KpiPriority };
