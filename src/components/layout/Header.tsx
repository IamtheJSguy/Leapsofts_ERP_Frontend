import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/hooks/api/useAuth';
import { useUnreadCount } from '@/hooks/api/useNotifications';
import { getDisplayName } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';
import { ProfileSettingsModal } from './ProfileSettingsModal';

export const Header = () => {
  const { toggleSidebar, setNotificationPanelOpen, theme, setTheme } = useUIStore();
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();
  const logout = useLogout();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  // comment out for now until we have a time capsule widget
  // const { data: todayShift } = useTodayShift();
  // const { mutate: checkInMutate, isPending: isCheckingIn } = useCheckIn();
  // const { mutate: checkOutMutate, isPending: isCheckingOut } = useCheckOut();
  // const { mutate: startBreakMutate, isPending: isStartingBreak } = useStartBreak();
  // const { mutate: endBreakMutate, isPending: isEndingBreak } = useEndBreak();

  // const isCheckedIn = useTimeTrackerStore((s) => s.isCheckedIn);
  // const isOnBreak = useTimeTrackerStore((s) => s.isOnBreak);
  // const elapsedSeconds = useTimeTrackerStore((s) => s.elapsedSeconds);
  // const syncWithShift = useTimeTrackerStore((s) => s.syncWithShift);

  // useEffect(() => {
  //   if (todayShift !== undefined) {
  //     syncWithShift(todayShift);
  //   }
  // }, [todayShift, syncWithShift]);

  // const handleCheckIn = () => checkInMutate(undefined);
  // const handleCheckOut = () => checkOutMutate(undefined);
  // const handleStartBreak = () => startBreakMutate(undefined);
  // const handleEndBreak = () => endBreakMutate(undefined);
  // const isShiftActionPending = isCheckingIn || isCheckingOut || isStartingBreak || isEndingBreak;

  // const formatTime = (seconds: number) => {
  //   const h = Math.floor(seconds / 3600);
  //   const m = Math.floor((seconds % 3600) / 60);
  //   const s = seconds % 60;
  //   return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
  // };

  const displayName = getDisplayName(user);
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    });
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        borderBottom: `1px solid ${tokens.surface.border}`,
      }}
    >
      <Toolbar sx={{ gap: 2, py: 1.5, minHeight: { xs: 64, sm: 72 } }}>
        <IconButton
          edge="start"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          sx={{
            color: 'text.secondary',
            bgcolor: 'background.paper',
            border: `1px solid ${tokens.surface.border}`,
            display: 'inline-flex',
            '&:hover': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.06)'
                  : tokens.brand.primary50,
              color: tokens.brand.primary,
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0, ml: { xs: 1, sm: 0 } }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {greeting()}
          </Typography>
          <Typography noWrap sx={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
            {displayName}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Time Capsule Widget (check-in / checkout) — temporarily hidden
          {user?.role !== 'admin' && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 1 },
                px: { xs: 1, sm: 1.5 },
                py: 0.5,
                borderRadius: `${tokens.radius.pill}px`,
                bgcolor: isOnBreak
                  ? theme === 'dark' ? 'rgba(184, 134, 11, 0.12)' : 'rgba(184, 134, 11, 0.06)'
                  : isCheckedIn
                    ? theme === 'dark' ? 'rgba(45, 138, 94, 0.08)' : 'rgba(45, 138, 94, 0.04)'
                    : theme === 'dark' ? 'rgba(255, 127, 17, 0.08)' : 'rgba(255, 127, 17, 0.04)',
                border: `1px solid ${isOnBreak
                  ? 'rgba(184, 134, 11, 0.25)'
                  : isCheckedIn
                    ? 'rgba(45, 138, 94, 0.15)'
                    : 'rgba(255, 127, 17, 0.15)'}`,
                backdropFilter: 'blur(20px)',
                mr: { xs: 0.5, sm: 1 },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isOnBreak
                    ? tokens.semantic.warning
                    : isCheckedIn
                      ? tokens.semantic.success
                      : tokens.brand.accent,
                  boxShadow: `0 0 8px ${isOnBreak
                    ? tokens.semantic.warning
                    : isCheckedIn
                      ? tokens.semantic.success
                      : tokens.brand.accent}`,
                  animation: 'pulse 2s infinite ease-in-out',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.4 },
                    '50%': { opacity: 1 },
                    '100%': { opacity: 0.4 },
                  },
                }}
              />

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: isOnBreak
                    ? tokens.semantic.warning
                    : isCheckedIn
                      ? tokens.semantic.success
                      : 'text.secondary',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {isOnBreak
                  ? 'ON BREAK'
                  : isCheckedIn
                    ? formatTime(elapsedSeconds)
                    : <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>INACTIVE</Box>}
              </Typography>

              {isCheckedIn && isOnBreak ? (
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleEndBreak}
                  disabled={isShiftActionPending}
                  sx={{
                    height: 24,
                    minWidth: 0,
                    px: { xs: 1, sm: 1.5 },
                    py: 0,
                    borderRadius: `${tokens.radius.pill}px`,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    bgcolor: tokens.semantic.warning,
                    color: '#fff',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: tokens.semantic.warning,
                      opacity: 0.9,
                      boxShadow: 'none',
                    },
                  }}
                >
                  {isEndingBreak ? '...' : 'End Break'}
                </Button>
              ) : isCheckedIn ? (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleStartBreak}
                    disabled={isShiftActionPending}
                    sx={{
                      height: 24,
                      minWidth: 0,
                      px: { xs: 0.75, sm: 1.25 },
                      py: 0,
                      borderRadius: `${tokens.radius.pill}px`,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      borderColor: 'rgba(184, 134, 11, 0.35)',
                      color: tokens.semantic.warning,
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: tokens.semantic.warning,
                        bgcolor: 'rgba(184, 134, 11, 0.08)',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {isStartingBreak ? '...' : 'Start Break'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleCheckOut}
                    disabled={isShiftActionPending}
                    sx={{
                      height: 24,
                      minWidth: 0,
                      px: { xs: 1, sm: 1.5 },
                      py: 0,
                      borderRadius: `${tokens.radius.pill}px`,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      bgcolor: tokens.semantic.error,
                      color: '#fff',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: tokens.semantic.error,
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {isCheckingOut ? '...' : 'Check Out'}
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleCheckIn}
                  disabled={isShiftActionPending}
                  sx={{
                    height: 24,
                    minWidth: 0,
                    px: { xs: 1, sm: 1.5 },
                    py: 0,
                    borderRadius: `${tokens.radius.pill}px`,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    bgcolor: tokens.brand.accent,
                    color: '#fff',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: tokens.brand.accentDark,
                      boxShadow: 'none',
                    },
                  }}
                >
                  {isCheckingIn ? 'Loading...' : 'Check In'}
                </Button>
              )}
            </Box>
          )}
          */}

          <IconButton
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
            sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'inline-flex' } }}
          >
            {theme === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
          </IconButton>
          <IconButton
            onClick={() => setNotificationPanelOpen(true)}
            aria-label="Notifications"
            sx={{
              color: 'text.secondary',
              bgcolor: 'background.paper',
              border: `1px solid ${tokens.surface.border}`,
              mx: 0.5,
            }}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: tokens.brand.accent,
                  color: '#fff',
                  fontWeight: 700,
                },
              }}
            >
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="User menu"
            sx={{ p: 0.5 }}
          >
            <Avatar
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                bgcolor: tokens.brand.primary,
                fontSize: { xs: 12, sm: 14 },
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                minWidth: 240,
                borderRadius: '16px',
                border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                bgcolor: theme === 'dark' ? 'rgba(30, 27, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: theme === 'dark'
                  ? '0 12px 40px rgba(0, 0, 0, 0.5)'
                  : '0 12px 40px rgba(26, 22, 37, 0.08)',
                p: 0.5,
              },
            },
          }}
        >
          {/* Header section with User Avatar, Name, Email, and Role badge */}
          <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: tokens.brand.primary100,
                color: tokens.brand.primary,
                fontSize: 15,
                fontWeight: 800,
                border: `1px solid ${tokens.brand.primary200}`,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, fontSize: '0.72rem' }} noWrap>
                {user?.email}
              </Typography>
              <Box sx={{ display: 'inline-flex', mt: 0.75 }}>
                <Chip
                  label={user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Manager' : 'Agent'}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    bgcolor: user?.role === 'admin'
                      ? theme === 'dark' ? 'rgba(255, 127, 17, 0.15)' : 'rgba(255, 127, 17, 0.06)'
                      : user?.role === 'manager'
                        ? theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'
                      : theme === 'dark' ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.06)',
                    color: user?.role === 'admin' ? tokens.brand.accent : user?.role === 'manager' ? '#3B82F6' : tokens.brand.primary,
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Divider sx={{ mx: 1, my: 0.5, opacity: theme === 'dark' ? 0.08 : 0.08 }} />

          {/* Menu Items with Premium Hover and Icons */}
          <MenuItem
            onClick={() => { setAnchorEl(null); navigate('/profile'); }}
            sx={{
              py: 1,
              px: 2,
              borderRadius: '8px',
              mx: 0.5,
              fontSize: '0.86rem',
              fontWeight: 600,
              gap: 1.5,
              color: 'text.primary',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(93, 26, 137, 0.04)',
                color: tokens.brand.primary,
              }
            }}
          >
            <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            My Profile
          </MenuItem>



          <Divider sx={{ mx: 1, my: 0.5, opacity: theme === 'dark' ? 0.08 : 0.08 }} />

          <MenuItem
            onClick={handleLogout}
            sx={{
              py: 1.25,
              px: 2,
              borderRadius: '8px',
              mx: 0.5,
              fontSize: '0.86rem',
              fontWeight: 750,
              gap: 1.5,
              color: tokens.semantic.error,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: theme === 'dark' ? 'rgba(196, 69, 69, 0.1)' : 'rgba(196, 69, 69, 0.05)',
              }
            }}
          >
            <LogoutIcon sx={{ fontSize: 18 }} />
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
      <ProfileSettingsModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </AppBar>
  );
};
