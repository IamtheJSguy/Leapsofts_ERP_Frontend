import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/router';
import { ToastProvider } from '@/components/common/ToastProvider';
import { AppUpdateBanner } from '@/components/common/AppUpdateBanner';
import { useUIStore } from '@/store/useUIStore';
import { lightTheme, darkTheme } from '@/styles/theme';

function App() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <RouterProvider router={router} />
          <ToastProvider />
          <AppUpdateBanner />
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
