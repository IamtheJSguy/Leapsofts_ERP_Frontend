import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export const EmptyState = ({
  title = 'No data',
  description = 'Nothing to show yet.',
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      color: 'text.secondary',
    }}
  >
    {icon || <InboxIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />}
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ mb: 2 }}>
      {description}
    </Typography>
    {actionLabel && onAction && (
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);
