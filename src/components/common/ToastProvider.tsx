import { Snackbar, Alert, Box, Typography, Avatar, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { router } from '@/router';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

export const ToastProvider = () => {
  const { toastQueue, removeToast, theme } = useUIStore();
  const current = toastQueue[0];
  const isDarkMode = theme === 'dark';

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (current) removeToast(current.id);
  };

  const handleMessageClick = () => {
    if (current && current.onClick) {
      current.onClick();
    } else if (current && current.conversationId) {
      router.navigate(`/chat/${current.conversationId}`);
    } else {
      router.navigate('/chat');
    }
    handleClose();
  };

  return (
    <Snackbar
      key={current?.id}
      open={!!current}
      autoHideDuration={current?.severity === 'message' ? 3000 : 3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {current ? (
        current.severity === 'message' ? (
          <Box
            onClick={handleMessageClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.25,
              pr: 5,
              borderRadius: '50px',
              bgcolor: isDarkMode ? '#232029' : '#ffffff',
              boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 10px 40px rgba(135,116,160,0.08)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
              cursor: 'pointer',
              minWidth: 320,
              maxWidth: 400,
              position: 'relative',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: isDarkMode ? '0 12px 48px rgba(0,0,0,0.5)' : '0 14px 48px rgba(135,116,160,0.12)',
              }
            }}
          >
            <Avatar
              src={current.avatar}
              sx={{ width: 44, height: 44, bgcolor: tokens.brand.primaryLight, fontWeight: 700 }}
            >
              {current.title ? current.title.charAt(0).toUpperCase() : 'M'}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 0.25 }}>
                {current.title || 'New Message'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {current.message}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              sx={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: 12,
                color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDarkMode ? '#fff' : '#000' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Alert
            severity={current.severity as 'success' | 'error' | 'warning' | 'info'}
            onClose={handleClose}
            variant="filled"
            sx={{ borderRadius: '12px', fontWeight: 600 }}
          >
            {current.message}
          </Alert>
        )
      ) : <Box />}
    </Snackbar>
  );
};
