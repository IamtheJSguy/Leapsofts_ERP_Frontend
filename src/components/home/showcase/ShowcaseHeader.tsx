import React from 'react';
import { Box, Typography, IconButton, Badge, Avatar, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { tokens } from '@/styles/tokens';

interface ShowcaseHeaderProps {
  onToggleTheme?: () => void;
  demoTheme?: 'dark' | 'light';
}

export const ShowcaseHeader: React.FC<ShowcaseHeaderProps> = ({ onToggleTheme, demoTheme }) => {
  const theme = useTheme();
  const isDarkMode = demoTheme !== undefined ? demoTheme === 'dark' : theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: 0.75,
        bgcolor: isDarkMode ? '#171420' : '#FFFFFF',
        borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      {/* Left: Hamburger menu + Greeting */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <IconButton
          size="small"
          sx={{
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
            p: 0.5,
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: '8px',
          }}
        >
          <MenuIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Box>
          <Typography
            sx={{
              fontSize: '0.6rem',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary',
              fontWeight: 500,
              lineHeight: 1.1,
            }}
          >
            Good evening
          </Typography>
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: isDarkMode ? '#FFFFFF' : tokens.text.primary,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            Huzaifa Rasheed
          </Typography>
        </Box>
      </Box>

      {/* Right: Theme Toggle, Notification Bell, Avatar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch demo to Light Mode' : 'Switch demo to Dark Mode'}
          sx={{
            color: isDarkMode ? '#FCD34D' : '#5D1A89',
            p: 0.5,
            borderRadius: '8px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(93, 26, 137, 0.04)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(93, 26, 137, 0.08)',
              transform: 'scale(1.08)',
            },
          }}
        >
          {isDarkMode ? (
            <LightModeOutlinedIcon sx={{ fontSize: 16, color: '#FCD34D' }} />
          ) : (
            <DarkModeOutlinedIcon sx={{ fontSize: 16, color: '#5D1A89' }} />
          )}
        </IconButton>

        <IconButton
          size="small"
          sx={{
            color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
            p: 0.5,
          }}
        >
          <Badge
            badgeContent={85}
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#FF7F11',
                color: '#fff',
                fontSize: '0.55rem',
                fontWeight: 800,
                height: 14,
                minWidth: 14,
                px: 0.3,
              },
            }}
          >
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 16 }} />
          </Badge>
        </IconButton>

        <Avatar
          sx={{
            width: 26,
            height: 26,
            bgcolor: tokens.brand.primary,
            backgroundImage: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.primaryLight})`,
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.68rem',
            border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          HR
        </Avatar>
      </Box>
    </Box>
  );
};
