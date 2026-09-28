import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { consumeDriveReturnPath, DRIVE_CONNECTED_EVENT } from '@/hooks/api/useDrive';

const DriveConnectedPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(DRIVE_CONNECTED_EVENT, String(Date.now()));
    const payload = { type: DRIVE_CONNECTED_EVENT };
    try {
      window.opener?.postMessage(payload, window.location.origin);
      window.opener?.focus();
    } catch {
      // The opener can still refresh from the localStorage signal.
    }
    window.close();
  }, []);

  const goBack = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
      return;
    }
    navigate(consumeDriveReturnPath(), { replace: true });
  };

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
      <CheckCircleIcon sx={{ fontSize: 48, color: '#0F9D58' }} />
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        Google Drive is connected
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360 }}>
        You can close this window and return to the page you started from.
      </Typography>
      <Button variant="contained" onClick={goBack} sx={{ textTransform: 'none', fontWeight: 700 }}>
        Back to the app
      </Button>
    </Box>
  );
};

export default DriveConnectedPage;
