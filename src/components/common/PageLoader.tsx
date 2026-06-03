import { Box, CircularProgress } from '@mui/material';

export const PageLoader = () => (
  <Box className="flex items-center justify-center min-h-[300px]">
    <CircularProgress aria-label="Loading page" />
  </Box>
);
