import { useEffect } from 'react';
import { Box, Button, Chip, Typography, useTheme } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import {
  useCalendarStatus,
  useCalendarAuthUrl,
  useDisconnectCalendar,
  useSyncCalendar,
  openCalendarOAuthPopup,
  CALENDAR_CONNECTED_EVENT,
  refreshCalendarConnection,
} from '@/hooks/api/useCalendar';
import SyncIcon from '@mui/icons-material/Sync';
import { formatDistanceToNow } from 'date-fns';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import { showApiError } from '@/utils/apiError';

export const GoogleCalendarConnectPanel = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { data: calendarStatus, refetch: refetchCalendarStatus } = useCalendarStatus();
  const calendarAuth = useCalendarAuthUrl();
  const disconnectCalendar = useDisconnectCalendar();
  const syncCalendar = useSyncCalendar();
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    const onCalendarConnected = () => {
      refreshCalendarConnection();
      void refetchCalendarStatus();
      addToast({ message: 'Google Calendar connected', severity: 'success' });
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === CALENDAR_CONNECTED_EVENT) onCalendarConnected();
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === CALENDAR_CONNECTED_EVENT) {
        onCalendarConnected();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('message', onMessage);
    };
  }, [addToast, refetchCalendarStatus]);

  const connected = calendarStatus?.connected === true;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        borderRadius: '16px',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
        boxShadow: tokens.shadow.card,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
        <EventIcon sx={{ color: tokens.brand.primary, mt: 0.25, flexShrink: 0 }} />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
              Google Calendar
            </Typography>
            <Chip
              size="small"
              label={connected ? 'Connected' : 'Not connected'}
              color={connected ? 'success' : 'default'}
            />
          </Box>
          {!connected && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.86rem' }}>
              Connect to sync your primary Google Calendar, auto-generate Meet links, and send invites.
            </Typography>
          )}
          {connected && calendarStatus?.accountEmail && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              Connected as {calendarStatus.accountEmail}
            </Typography>
          )}
          {connected && calendarStatus?.lastSyncedAt && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Last synced {formatDistanceToNow(new Date(calendarStatus.lastSyncedAt), { addSuffix: true })}
            </Typography>
          )}
          {connected && calendarStatus?.importError && (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
              Sync issue: {calendarStatus.importError}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ flexShrink: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {connected ? (
          <>
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              disabled={syncCalendar.isPending}
              onClick={() =>
                syncCalendar.mutate(undefined, {
                  onSuccess: (result) => {
                    if (result.error) {
                      addToast({ message: result.error, severity: 'error' });
                      return;
                    }
                    addToast({
                      message: `Calendar synced (${result.imported} new, ${result.updated} updated)`,
                      severity: 'success',
                    });
                  },
                  onError: (err) => showApiError(err),
                })
              }
              sx={{
                bgcolor: tokens.brand.solid,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '12px',
                '&:hover': { bgcolor: tokens.brand.primaryDark },
              }}
            >
              Sync calendar
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              disabled={disconnectCalendar.isPending}
              onClick={() =>
                disconnectCalendar.mutate(undefined, {
                  onSuccess: () => addToast({ message: 'Google Calendar disconnected', severity: 'info' }),
                })
              }
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            disabled={calendarAuth.isPending}
            onClick={() => {
              calendarAuth.mutate(undefined, {
                onSuccess: (url) => openCalendarOAuthPopup(url),
                onError: (err) => showApiError(err),
              });
            }}
            sx={{
              bgcolor: tokens.brand.solid,
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '12px',
              '&:hover': { bgcolor: tokens.brand.primaryDark },
            }}
          >
            Connect Google Calendar
          </Button>
        )}
      </Box>
    </Box>
  );
};
