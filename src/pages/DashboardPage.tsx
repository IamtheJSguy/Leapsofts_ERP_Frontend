import { useState, useEffect } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { useAuth } from '@/hooks/useAuth';
import { useMeetings } from '@/hooks/api/useMeetings';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { getDisplayName } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';

const DashboardPage = () => {
  const { isAdmin, user } = useAuth();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Fetch scheduled meetings
  const { data: meetings } = useMeetings({ status: 'scheduled' });

  // Get closest upcoming meeting, fallback to mock if none
  const upcomingMeeting = meetings?.find(m => new Date(m.scheduledAt).getTime() > Date.now()) || {
    title: `meeting with luke with ${getDisplayName(user)}`,
    scheduledAt: new Date(Date.now() + 114.88 * 60 * 60 * 1000).toISOString(),
    meetingLink: undefined as string | undefined,
    link: undefined as string | undefined,
  };

  const joinUrl = (upcomingMeeting as any).meetingLink || (upcomingMeeting as any).link || null;

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(upcomingMeeting.scheduledAt).getTime() - Date.now();
      return diff > 0 ? Math.floor(diff / 1000) : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingMeeting.scheduledAt]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return {
      hours: String(hrs).padStart(2, '0'),
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
    };
  };

  const { hours, minutes, seconds } = formatTime(timeLeft);

  // Dynamic Stylized Date formatting matching reference screenshot
  const getStylizedDate = () => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      dayName: days[now.getDay()],
      dayNum: now.getDate(),
      monthYear: `${months[now.getMonth()]} ${now.getFullYear()}`
    };
  };

  const { dayName, dayNum, monthYear } = getStylizedDate();

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      {/* Header Greeting & Stylized Date Row */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.025em',
              mb: 0.5,
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }}
          >
            Good evening, {getDisplayName(user)}
          </Typography>
          <Typography
            variant="body1"
            sx={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.92rem'
            }}
          >
            Here&apos;s what&apos;s happening at Leapsofts today.
          </Typography>
        </Box>

        {/* Elegant Stylized Date Pill */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.035)'}`,
            borderRadius: '20px',
            px: 2.2,
            py: 0.8,
            userSelect: 'none'
          }}
        >
          <Typography 
            sx={{ 
              fontWeight: 800, 
              fontSize: '0.8rem',
              color: tokens.brand.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1
            }}
          >
            {dayName}
          </Typography>
          <Box sx={{ width: '1px', height: '14px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
          <Typography 
            sx={{ 
              fontWeight: 850, 
              fontSize: '1.8rem',
              color: isDarkMode ? '#fff' : tokens.text.primary,
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}
          >
            {dayNum}
          </Typography>
          <Box sx={{ width: '1px', height: '14px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
          <Typography 
            sx={{ 
              fontWeight: 600, 
              fontSize: '0.85rem',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : tokens.text.secondary,
              lineHeight: 1
            }}
          >
            {monthYear}
          </Typography>
        </Box>
      </Box>

      {/* Next Meeting Card Row - Premium Soft UI */}
      <Box
        sx={{
          mb: 4,
          p: 2.5,
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)'}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 12px 36px rgba(26, 22, 37, 0.04), 0 1px 4px rgba(26, 22, 37, 0.02)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
            transform: 'translateY(-1px)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.2, width: { xs: '100%', sm: 'auto' } }}>
          {/* Camera Icon in Soft circular gradient background */}
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: '16px',
              background: isDarkMode 
                ? 'radial-gradient(circle, rgba(255,127,17,0.12) 0%, rgba(255,127,17,0.02) 100%)' 
                : 'radial-gradient(circle, rgba(255,127,17,0.08) 0%, rgba(255,127,17,0.02) 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(255,127,17,0.2)' : 'rgba(255,127,17,0.12)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.brand.accent,
              flexShrink: 0
            }}
          >
            <VideocamOutlinedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : tokens.text.muted,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                mb: 0.4,
                fontSize: '0.62rem'
              }}
            >
              Next meeting
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                fontSize: '1rem', 
                color: isDarkMode ? '#fff' : tokens.text.primary,
                letterSpacing: '-0.01em'
              }}
              noWrap
            >
              {upcomingMeeting.title}
            </Typography>
          </Box>
        </Box>

        {/* Countdown Timer and CTA Button */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1.5, sm: 3.5 }, 
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' }
          }}
        >
          {/* Live Countdown Timer with Soft digit blocks */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.015)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}`,
                borderRadius: '10px',
                px: 1.2,
                py: 0.6,
                minWidth: 44,
                textAlign: 'center'
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: isDarkMode ? '#fff' : tokens.text.primary, lineHeight: 1 }}>
                  {hours}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.04em', mt: 0.5 }}>
                HR
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: tokens.text.muted, pb: 2.2 }}>:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.015)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}`,
                borderRadius: '10px',
                px: 1.2,
                py: 0.6,
                minWidth: 44,
                textAlign: 'center'
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: isDarkMode ? '#fff' : tokens.text.primary, lineHeight: 1 }}>
                  {minutes}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.04em', mt: 0.5 }}>
                MIN
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: tokens.text.muted, pb: 2.2 }}>:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.015)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}`,
                borderRadius: '10px',
                px: 1.2,
                py: 0.6,
                minWidth: 44,
                textAlign: 'center'
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: isDarkMode ? '#fff' : tokens.text.primary, lineHeight: 1 }}>
                  {seconds}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.04em', mt: 0.5 }}>
                SEC
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            disableElevation
            disabled={!joinUrl}
            onClick={() => {
              if (joinUrl) window.open(joinUrl, '_blank', 'noopener,noreferrer');
            }}
            sx={{
              background: joinUrl
                ? `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.accentLight} 100%)`
                : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
              color: joinUrl ? '#fff' : 'text.disabled',
              fontWeight: 800,
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              px: { xs: 2, sm: 3.5 },
              py: { xs: 0.8, sm: 1.1 },
              borderRadius: '20px',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              boxShadow: joinUrl ? '0 4px 15px rgba(255, 127, 17, 0.18)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': joinUrl ? {
                background: `linear-gradient(135deg, ${tokens.brand.accentDark} 0%, ${tokens.brand.accent} 100%)`,
                boxShadow: '0 6px 20px rgba(255, 127, 17, 0.28)',
                transform: 'translateY(-1px)'
              } : {},
              '&:active': {
                transform: joinUrl ? 'scale(0.97)' : 'none',
              },
              '&.Mui-disabled': {
                color: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
              },
            }}
          >
            {joinUrl ? 'Join' : 'No Link'}
          </Button>
        </Box>
      </Box>

      {/* Main Dashboard Render */}
      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </Box>
  );
};

export default DashboardPage;

