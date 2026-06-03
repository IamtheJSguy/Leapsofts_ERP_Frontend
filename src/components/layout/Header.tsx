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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/hooks/api/useAuth';
import { useUnreadCount } from '@/hooks/api/useNotifications';
import { getDisplayName } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';

export const Header = () => {
  const { toggleSidebar, setNotificationPanelOpen, theme, setTheme } = useUIStore();
  const { user } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();
  const logout = useLogout();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
        bgcolor: 'transparent',
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
            '&:hover': { bgcolor: tokens.brand.primary50 },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {greeting()}
          </Typography>
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {displayName}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
            sx={{ color: 'text.secondary' }}
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
                width: 40,
                height: 40,
                bgcolor: tokens.brand.primary,
                fontSize: 14,
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
                mt: 1,
                minWidth: 200,
                borderRadius: 3,
                border: `1px solid ${tokens.surface.border}`,
                boxShadow: tokens.shadow.card,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ py: 1.25, fontWeight: 500 }}>
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
