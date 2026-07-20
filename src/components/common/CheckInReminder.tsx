import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import { useTimeTrackerStore } from '@/store/useTimeTrackerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

export const CheckInReminder = () => {
  const isCheckedIn = useTimeTrackerStore((s) => s.isCheckedIn);
  const checkIn = useTimeTrackerStore((s) => s.checkIn);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  
  const [open, setOpen] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isAuthenticated || isCheckedIn || user?.role === 'admin' || user?.role === 'manager') {
      setOpen(false);
      return;
    }

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('checkin_reminder_dismissed') === 'true';
    if (isDismissed) return;

    // Show after 3 seconds or on user activity
    const timer = setTimeout(() => {
      setOpen(true);
    }, 3000);

    const handleActivity = () => {
      setOpen(true);
      cleanup();
    };

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });

    return cleanup;
  }, [isAuthenticated, isCheckedIn, user?.role]);

  const handleCheckInNow = () => {
    checkIn();
    setOpen(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('checkin_reminder_dismissed', 'true');
    setOpen(false);
  };

  if (!isAuthenticated || isCheckedIn || user?.role === 'admin' || user?.role === 'manager' || !open) return null;

  return (
    <Slide in={open} direction="up" mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: { xs: 'calc(100% - 48px)', sm: 380 },
          borderRadius: `${tokens.radius.lg}px`,
          p: 2.5,
          zIndex: 1100,
          background: isDark ? 'rgba(30, 27, 36, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          /* backdropFilter: 'blur(20px)' (removed for performance) */
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.08)'}`,
          boxShadow: tokens.shadow.card,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Pulsing indicator icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(255, 127, 17, 0.15)' : 'rgba(255, 127, 17, 0.1)',
              color: tokens.brand.accent,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '12px',
                border: `2px solid ${tokens.brand.accent}`,
                animation: 'pulseGlow 2s infinite ease-in-out',
                opacity: 0,
              },
              '@keyframes pulseGlow': {
                '0%': { transform: 'scale(0.95)', opacity: 0.5 },
                '50%': { transform: 'scale(1.2)', opacity: 0 },
                '100%': { transform: 'scale(0.95)', opacity: 0 },
              }
            }}
          >
            <AccessTimeFilledIcon sx={{ fontSize: 20 }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              Clock In Reminder
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.4, fontSize: '0.825rem' }}>
              Welcome back! Don't forget to check in to track your working hours today.
            </Typography>
          </Box>

          <IconButton size="small" onClick={handleDismiss} sx={{ color: 'text.muted', mt: -0.5, mr: -0.5 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            size="small"
            variant="text"
            onClick={handleDismiss}
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'none',
              fontSize: '0.75rem',
            }}
          >
            Maybe Later
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleCheckInNow}
            sx={{
              fontWeight: 800,
              bgcolor: tokens.brand.accent,
              color: '#fff',
              px: 2,
              borderRadius: `${tokens.radius.sm}px`,
              textTransform: 'none',
              fontSize: '0.75rem',
              '&:hover': {
                bgcolor: tokens.brand.accentDark,
              },
            }}
          >
            Check In Now
          </Button>
        </Box>
      </Paper>
    </Slide>
  );
};
