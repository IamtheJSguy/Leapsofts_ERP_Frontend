import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { consumeCrmReturnPath, CRM_CONNECTED_EVENT, refreshCrmConnections } from '@/hooks/api/useCrm';

const CrmConnectedPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(CRM_CONNECTED_EVENT, String(Date.now()));
    refreshCrmConnections();
    const payload = { type: CRM_CONNECTED_EVENT };
    try {
      window.opener?.postMessage(payload, window.location.origin);
      window.opener?.focus();
    } catch {
      // opener may refresh via localStorage signal
    }
    window.close();
  }, []);

  const goBack = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
      return;
    }
    navigate(consumeCrmReturnPath(), { replace: true });
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
        CRM connected
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360 }}>
        You can close this window and return to Admin settings.
      </Typography>
      <Button variant="contained" onClick={goBack} sx={{ textTransform: 'none', fontWeight: 700 }}>
        Back to the app
      </Button>
    </Box>
  );
};

export default CrmConnectedPage;
