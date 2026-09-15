import { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { NotificationPanel } from './NotificationPanel';
import { useUIStore } from '@/store/useUIStore';
import { useTimeTrackerStore } from '@/store/useTimeTrackerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/hooks/useSocket';
import { useConversations } from '@/hooks/api/useChat';
import { useMe } from '@/hooks/api/useUsers';
import { useChatStore } from '@/store/useChatStore';
import { getMergedUnreadCount } from '@/utils/chatUnreadUtils';
import { useUnreadCount } from '@/hooks/api/useNotifications';
import { tokens } from '@/styles/tokens';
import api from '@/lib/axios';
import { useLogout } from '@/hooks/api/useAuth';

export const AppLayout = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isCheckedIn = useTimeTrackerStore((s) => s.isCheckedIn);
  const tick = useTimeTrackerStore((s) => s.tick);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [monitoringOpen, setMonitoringOpen] = useState(false);
  useMe();
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

  const { data: unreadNotificationsCount = 0 } = useUnreadCount();

  useEffect(() => {
    let totalUnreadChats = 0;
    conversations.forEach((conv) => {
      const count = getMergedUnreadCount(conv, unreadCounts);
      if (count > 0) totalUnreadChats++;
    });

    const totalUnread = totalUnreadChats + unreadNotificationsCount;

    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (favicon) {
      favicon.type = 'image/png';
      favicon.href = totalUnread > 0 ? '/logo/leapsofts-msg.png' : '/logo/leapsofts.png';
    }

    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Leapsofts ERP`;
    } else {  
      document.title = 'Leapsofts ERP';
    }
  }, [conversations, unreadCounts, unreadNotificationsCount]);

  useEffect(() => {
    if (!user || user.monitoringPolicyAcknowledgedAt) return;
    api.get('/admin/monitoring-config').then((res) => {
      const cfg = res.data.data as { screenshotsEnabled?: boolean; appUsageEnabled?: boolean };
      if (cfg.screenshotsEnabled || cfg.appUsageEnabled) setMonitoringOpen(true);
    }).catch(() => undefined);
  }, [user]);

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
        {user?.impersonatedBy && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => logout.mutate()}>
                End impersonation
              </Button>
            }
          >
            Viewing as {user.firstName || user.email} — impersonated by Leapsofts support
          </Alert>
        )}
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
      <Dialog open={monitoringOpen}>
        <DialogTitle>Workplace monitoring</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This organization captures activity screenshots and/or application usage during your shift.
            Continue only if you acknowledge this policy.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={async () => {
              await api.post('/users/me/acknowledge-monitoring');
              useAuthStore.getState().updateUser({ monitoringPolicyAcknowledgedAt: new Date().toISOString() });
              setMonitoringOpen(false);
            }}
          >
            I understand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

