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
import { getMergedUnreadCount } from '@/utils/chatUnreadUtils';
import { tokens } from '@/styles/tokens';

export const AppLayout = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isCheckedIn = useTimeTrackerStore((s) => s.isCheckedIn);
  const tick = useTimeTrackerStore((s) => s.tick);
  const user = useAuthStore((s) => s.user);
  useSocket();

  const { data: conversations = [] } = useConversations();
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const syncUnreadFromConversations = useChatStore((s) => s.syncUnreadFromConversations);

  useEffect(() => {
    if (conversations.length > 0) {
      syncUnreadFromConversations(conversations);
    }
  }, [conversations, syncUnreadFromConversations]);

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
    conversations.forEach((conv) => {
      const count = getMergedUnreadCount(conv, unreadCounts);
      if (count > 0) totalUnread++;
    });

    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (favicon) {
      favicon.type = 'image/png';
      favicon.href = totalUnread > 0 ? '/logo/leapsofts-msg.png' : '/logo/leapsofts.png';
    }

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
          transition: (t) =>
            t.transitions.create(['width', 'margin'], {
              easing: t.transitions.easing.sharp,
              duration: sidebarOpen
                ? t.transitions.duration.enteringScreen
                : t.transitions.duration.leavingScreen,
            }),
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

