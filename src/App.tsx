import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/router';
import { ToastProvider } from '@/components/common/ToastProvider';
import { useUIStore } from '@/store/useUIStore';
import { lightTheme, darkTheme } from '@/styles/theme';

function App() {
  const theme = useUIStore((s) => s.theme);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
        <CssBaseline />
        <RouterProvider router={router} />
        <ToastProvider />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
