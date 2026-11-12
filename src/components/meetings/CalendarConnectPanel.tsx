import { useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { formatDistanceToNow } from 'date-fns';
import {
  useCalendarStatus,
  useCalendarAuthUrl,
  useDisconnectCalendar,
  useSyncCalendar,
  openCalendarOAuthPopup,
  CALENDAR_CONNECTED_EVENT,
  refreshCalendarConnection,
  type CalendarProvider,
} from '@/hooks/api/useCalendar';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import { showApiError } from '@/utils/apiError';

const GoogleMark = ({ size = 28 }: { size?: number }) => (
  <Box
    component="svg"
    viewBox="0 0 48 48"
    width={size}
    height={size}
    aria-hidden
    sx={{ display: 'block', flexShrink: 0 }}
  >
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.026,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </Box>
);

const MicrosoftMark = ({ size = 28 }: { size?: number }) => (
  <Box
    component="svg"
    viewBox="0 0 48 48"
    width={size}
    height={size}
    aria-hidden
    sx={{ display: 'block', flexShrink: 0 }}
  >
    <path fill="#f25022" d="M6 6h16v16H6z" />
    <path fill="#7fba00" d="M26 6h16v16H26z" />
    <path fill="#00a4ef" d="M6 26h16v16H6z" />
    <path fill="#ffb900" d="M26 26h16v16H26z" />
  </Box>
);

type ProviderTileProps = {
  provider: CalendarProvider;
  label: string;
  shortLabel: string;
  isActive: boolean;
  blocked: boolean;
  accountEmail?: string | null;
  onConnect: () => void;
  connectPending: boolean;
};

const ProviderTile = ({
  provider,
  label,
  shortLabel,
  isActive,
  blocked,
  accountEmail,
  onConnect,
  connectPending,
}: ProviderTileProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const connectControl = (
    <Button
      size="small"
      variant={isActive ? 'outlined' : 'contained'}
      disabled={connectPending || blocked || isActive}
      onClick={onConnect}
      sx={{
        minWidth: 0,
        px: 1.5,
        py: 0.5,
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'none',
        borderRadius: '10px',
        flexShrink: 0,
        ...(!isActive && !blocked
          ? {
              bgcolor: tokens.brand.solid,
              '&:hover': { bgcolor: tokens.brand.primaryDark },
            }
          : {}),
      }}
    >
      {isActive ? 'Connected' : 'Connect'}
    </Button>
  );

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        p: 1.25,
        borderRadius: '12px',
        border: `1px solid ${
          isActive
            ? 'rgba(76, 175, 80, 0.45)'
            : isDarkMode
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.08)'
        }`,
        bgcolor: isActive
          ? isDarkMode
            ? 'rgba(76, 175, 80, 0.08)'
            : 'rgba(76, 175, 80, 0.06)'
          : isDarkMode
            ? 'rgba(255,255,255,0.02)'
            : 'rgba(0,0,0,0.02)',
        opacity: blocked && !isActive ? 0.55 : 1,
      }}
    >
      {provider === 'google' ? <GoogleMark /> : <MicrosoftMark />}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 800, fontSize: '0.82rem', lineHeight: 1.2 }}
          noWrap
        >
          {shortLabel}
        </Typography>
        {isActive && accountEmail ? (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {accountEmail}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {provider === 'google' ? 'Meet links' : 'Teams links'}
          </Typography>
        )}
      </Box>
      {blocked && !isActive ? (
        <Tooltip title={`Disconnect ${label} before connecting this one`}>
          <span>{connectControl}</span>
        </Tooltip>
      ) : (
        connectControl
      )}
    </Box>
  );
};

export const CalendarConnectPanel = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));
  const { data: calendarStatus, refetch: refetchCalendarStatus } = useCalendarStatus();
  const calendarAuth = useCalendarAuthUrl();
  const disconnectCalendar = useDisconnectCalendar();
  const syncCalendar = useSyncCalendar();
  const addToast = useUIStore((s) => s.addToast);

  const connected = calendarStatus?.connected === true;
  const provider = calendarStatus?.provider ?? null;

  useEffect(() => {
    const onCalendarConnected = () => {
      refreshCalendarConnection();
      void refetchCalendarStatus().then((res) => {
        if (res.data?.connected) {
          addToast({ message: 'Calendar connected', severity: 'success' });
        }
      });
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

  const connect = (target: CalendarProvider) => {
    calendarAuth.mutate(target, {
      onSuccess: (url) => openCalendarOAuthPopup(url),
      onError: (err) => showApiError(err),
    });
  };

  const runSync = () => {
    syncCalendar.mutate(undefined, {
      onSuccess: (result) => {
        if (result?.error) {
          addToast({ message: result.error, severity: 'error' });
          return;
        }
        addToast({
          message: 'Calendar sync queued — updates will appear shortly.',
          severity: 'success',
        });
      },
      onError: (err) => showApiError(err),
    });
  };

  const activeLabel = provider === 'microsoft' ? 'Outlook' : 'Google';

  return (
    <Box
      sx={{
        mb: 2.5,
        p: 1.5,
        borderRadius: '14px',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
        boxShadow: tokens.shadow.card,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1.25,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.88rem' }}>
            Calendar sync
          </Typography>
          <Chip
            size="small"
            label={connected ? `${activeLabel} connected` : 'Not connected'}
            color={connected ? 'success' : 'default'}
            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
          />
          {connected && calendarStatus?.lastSyncedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Synced {formatDistanceToNow(new Date(calendarStatus.lastSyncedAt), { addSuffix: true })}
            </Typography>
          )}
        </Box>
        {connected && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Sync now">
              <span>
                <IconButton
                  size="small"
                  disabled={syncCalendar.isPending}
                  onClick={runSync}
                  aria-label="Sync calendar"
                >
                  <SyncIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Disconnect">
              <span>
                <IconButton
                  size="small"
                  color="inherit"
                  disabled={disconnectCalendar.isPending}
                  onClick={() =>
                    disconnectCalendar.mutate(undefined, {
                      onSuccess: () =>
                        addToast({ message: `${activeLabel} Calendar disconnected`, severity: 'info' }),
                    })
                  }
                  aria-label="Disconnect calendar"
                >
                  <LinkOffIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>

      {connected && calendarStatus?.importError && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          Sync issue: {calendarStatus.importError}
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        One provider at a time — meetings sync with Meet or Teams links.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          gap: 1,
        }}
      >
        <ProviderTile
          provider="google"
          label="Google Calendar"
          shortLabel="Google Calendar"
          isActive={connected && provider === 'google'}
          blocked={connected && provider !== 'google'}
          accountEmail={calendarStatus?.accountEmail}
          onConnect={() => connect('google')}
          connectPending={calendarAuth.isPending}
        />
        <ProviderTile
          provider="microsoft"
          label="Outlook Calendar"
          shortLabel="Outlook"
          isActive={connected && provider === 'microsoft'}
          blocked={connected && provider !== 'microsoft'}
          accountEmail={calendarStatus?.accountEmail}
          onConnect={() => connect('microsoft')}
          connectPending={calendarAuth.isPending}
        />
      </Box>
    </Box>
  );
};

/** @deprecated Use CalendarConnectPanel */
export const GoogleCalendarConnectPanel = CalendarConnectPanel;
