import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Header } from './Header';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { NotificationPanel } from './NotificationPanel';
import { useUIStore } from '@/store/useUIStore';
import { useTimeTrackerStore } from '@/store/useTimeTrackerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocket } from '@/hooks/useSocket';
import { useConversations, warmMessagesForConversations } from '@/hooks/api/useChat';
import { useMe } from '@/hooks/api/useUsers';
import { useChatStore } from '@/store/useChatStore';
import { getMergedUnreadCount } from '@/utils/chatUnreadUtils';
import { useUnreadCount } from '@/hooks/api/useNotifications';
import { tokens } from '@/styles/tokens';
import api from '@/lib/axios';
import { DRIVE_CONNECTED_EVENT, refreshDriveConnection } from '@/hooks/api/useDrive';
import { useLogout } from '@/hooks/api/useAuth';
import { useEntitlements, type OrgModuleFlags } from '@/hooks/useEntitlements';
import {
  hasCompletedMonitoringPromptThisSession,
  isMonitoringPromptPending,
  markMonitoringPromptCompleted,
} from '@/utils/monitoringPromptSession';

export const AppLayout = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isCheckedIn = useTimeTrackerStore((s) => s.isCheckedIn);
  const tick = useTimeTrackerStore((s) => s.tick);
  const user = useAuthStore((s) => s.user);
  const organizationId = user?.organizationId;
  const queryClient = useQueryClient();
  const previousOrganizationId = useRef(organizationId);
  const logout = useLogout();
  const [monitoringOpen, setMonitoringOpen] = useState(false);
  const entitlements: OrgModuleFlags = useEntitlements();
  const chatEnabled = entitlements.chat;
  useMe();
  useSocket();

  useEffect(() => {
    const onConnected = () => refreshDriveConnection();
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === DRIVE_CONNECTED_EVENT) onConnected();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === DRIVE_CONNECTED_EVENT) onConnected();
    };
    window.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!organizationId) {
      previousOrganizationId.current = organizationId;
      return;
    }
    if (previousOrganizationId.current === organizationId) return;
    const hadPreviousOrganization = Boolean(previousOrganizationId.current);
    previousOrganizationId.current = organizationId;
    if (!hadPreviousOrganization) return;
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey.includes(organizationId),
    });
    void queryClient.invalidateQueries({ queryKey: ['me'] });
  }, [organizationId, queryClient]);

  const backgroundRefreshCount = useIsFetching({
    predicate: (query) => query.state.data !== undefined,
  });

  const { data: conversations = [] } = useConversations({ enabled: chatEnabled });
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const syncUnreadFromConversations = useChatStore((s) => s.syncUnreadFromConversations);

  useEffect(() => {
    if (conversations.length > 0) {
      syncUnreadFromConversations(conversations);
    }
  }, [conversations, syncUnreadFromConversations]);

  // Prefetch latest message pages into React Query / IndexedDB so chats open instantly.
  useEffect(() => {
    if (!chatEnabled || !conversations.length) return;
    let cancelled = false;
    void warmMessagesForConversations(queryClient, conversations, organizationId).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [chatEnabled, conversations, organizationId, queryClient]);

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
    if (!user?._id) return;
    // Already handled for this browser session (covers refresh + org switch).
    if (hasCompletedMonitoringPromptThisSession(user._id)) return;
    // Already acknowledged in the past — don't prompt again this session.
    if (user.monitoringPolicyAcknowledgedAt) {
      markMonitoringPromptCompleted(user._id);
      return;
    }
    // Only arm this dialog from a fresh login/register, not refresh or org switch.
    if (!isMonitoringPromptPending()) return;

    let cancelled = false;
    api.get('/admin/monitoring-config').then((res) => {
      if (cancelled) return;
      const cfg = res.data.data as { screenshotsEnabled?: boolean; appUsageEnabled?: boolean };
      // Consume the pending flag whether or not monitoring is enabled, so refresh won't re-open.
      markMonitoringPromptCompleted(user._id);
      if (cfg.screenshotsEnabled || cfg.appUsageEnabled) setMonitoringOpen(true);
    }).catch(() => {
      if (!cancelled) markMonitoringPromptCompleted(user._id);
    });

    return () => {
      cancelled = true;
    };
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
        {backgroundRefreshCount > 0 ? (
          <LinearProgress sx={{ height: 2 }} />
        ) : (
          <Box sx={{ height: 2 }} />
        )}
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
              if (user?._id) markMonitoringPromptCompleted(user._id);
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
