import { useEffect, useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { consumeCalendarReturnPath, CALENDAR_CONNECTED_EVENT } from '@/hooks/api/useCalendar';

const providerLabel = (provider: string | null) => {
  if (provider === 'microsoft') return 'Outlook Calendar';
  if (provider === 'google') return 'Google Calendar';
  return 'Calendar';
};

const CalendarConnectedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success') === '1';
  const errorMessage = searchParams.get('error');
  const provider = searchParams.get('provider');
  const label = useMemo(() => providerLabel(provider), [provider]);

  useEffect(() => {
    if (!success || errorMessage) return;
    localStorage.setItem(CALENDAR_CONNECTED_EVENT, String(Date.now()));
    const payload = { type: CALENDAR_CONNECTED_EVENT };
    try {
      window.opener?.postMessage(payload, window.location.origin);
      window.opener?.focus();
    } catch {
      // opener may refresh via localStorage signal
    }
    const timer = window.setTimeout(() => {
      try {
        window.close();
      } catch {
        // ignore
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [success, errorMessage]);

  const goBack = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
      return;
    }
    navigate(consumeCalendarReturnPath(), { replace: true });
  };

  const failed = Boolean(errorMessage) || !success;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 3,
        textAlign: 'center',
      }}
    >
      {failed ? (
        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
      ) : (
        <CheckCircleIcon sx={{ fontSize: 48, color: '#0F9D58' }} />
      )}
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {failed ? `${label} was not connected` : `${label} is connected`}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420 }}>
        {failed
          ? decodeURIComponent(errorMessage || 'Sign-in did not complete. Try again from Meetings.')
          : 'You can close this window and return to the page you started from.'}
      </Typography>
      {!failed && (
        <Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 420 }}>
          In Azure, the redirect URI must be your API callback (e.g.{' '}
          <code>http://localhost:5000/api/v1/calendar/microsoft/callback</code>), not this page.
        </Typography>
      )}
      <Button variant="contained" onClick={goBack} sx={{ textTransform: 'none', fontWeight: 700 }}>
        Back to the app
      </Button>
    </Box>
  );
};

export default CalendarConnectedPage;
