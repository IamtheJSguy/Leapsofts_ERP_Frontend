import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { isChunkLoadError, reloadOnceForStaleChunk } from '@/utils/chunkLoad';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isStaleChunk: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isStaleChunk: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, isStaleChunk: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkLoadError(error) && reloadOnceForStaleChunk()) {
      return;
    }
    if (import.meta.env.DEV) {
      console.error('Route error:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            {this.state.isStaleChunk
              ? 'The app was updated'
              : 'Something went wrong'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {this.state.isStaleChunk
              ? 'Please refresh to continue.'
              : 'An unexpected error occurred.'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
