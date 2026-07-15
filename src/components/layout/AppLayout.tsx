import { useEffect } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { NotificationPanel } from './NotificationPanel';
import { CheckInReminder } from '@/components/common/CheckInReminder';
import { useUIStore } from '@/store/useUIStore';
import { useTimeTrackerStore } from '@/store/useTimeTrackerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/hooks/useSocket';
import { useConversations } from '@/hooks/api/useChat';
import { useChatStore } from '@/store/useChatStore';
import { tokens } from '@/styles/tokens';

export const AppLayout = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isCheckedIn = useTimeTrackerStore((s) => s.isCheckedIn);
  const tick = useTimeTrackerStore((s) => s.tick);
  const user = useAuthStore((s) => s.user);
  useSocket();

  const { data: conversations = [] } = useConversations();
  const unreadCounts = useChatStore((s) => s.unreadCounts);

  useEffect(() => {
    if (!isCheckedIn || user?.role === 'admin') return;

    // Run tick immediately on check-in or layout mount to update time tracker state
    tick();

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isCheckedIn, tick, user?.role]);

  useEffect(() => {
    let totalUnread = 0;
    conversations.forEach((conv: any) => {
      const count = Math.max(conv.unreadCount || 0, unreadCounts[conv._id] || 0);
      if (count > 0) totalUnread++;
    });

    if (totalUnread > 0) {
      document.title = `(${totalUnread}) B2B Lead Gen`;
    } else {
      document.title = 'B2B Lead Gen';
    }
  }, [conversations, unreadCounts]);

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
      <CheckInReminder />
    </Box>
  );
};

