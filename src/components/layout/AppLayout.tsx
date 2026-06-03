import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { NotificationPanel } from './NotificationPanel';
import { useUIStore } from '@/store/useUIStore';
import { useSocket } from '@/hooks/useSocket';
import { tokens } from '@/styles/tokens';

export const AppLayout = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  useSocket();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: tokens.surface.main }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Header />
        <Box
          component="section"
          sx={{
            flex: 1,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
            pb: 4,
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <NotificationPanel />
    </Box>
  );
};
