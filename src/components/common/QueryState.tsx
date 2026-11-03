import { Box, Button, Typography, CircularProgress } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';

export interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  hasData?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  loadingFallback?: ReactNode;
  children: ReactNode;
}

export const QueryState = ({
  isLoading,
  isError,
  error,
  onRetry,
  hasData = false,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  loadingFallback,
  children,
}: QueryStateProps) => {
  const showLoading = isLoading && !hasData;

  if (showLoading) {
    return (
      <>
        {loadingFallback ?? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}
      </>
    );
  }

  if (isError && !hasData) {
    const message =
      error instanceof Error
        ? error.message
        : 'Something went wrong while loading this page.';
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Could not load data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>
        {onRetry && (
          <Button variant="contained" onClick={onRetry}>
            Try again
          </Button>
        )}
      </Box>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return <>{children}</>;
};
