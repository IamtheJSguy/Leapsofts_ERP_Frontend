import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChecklistIcon from '@mui/icons-material/Checklist';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { tokens } from '@/styles/tokens';

export type ShowcasePageId =
  | 'dashboard'
  | 'tasks'
  | 'projects'
  | 'sales'
  | 'team'
  | 'attendance'
  | 'meetings'
  | 'chat'
  | 'reports'
  | 'admin';

interface ShowcaseSidebarProps {
  activePage: ShowcasePageId;
  onSelectPage: (id: ShowcasePageId) => void;
}

interface NavItem {
  id: ShowcasePageId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const ShowcaseSidebar: React.FC<ShowcaseSidebarProps> = ({ activePage, onSelectPage }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const navGroups: NavGroup[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 15 }} /> },
        { id: 'tasks', label: 'Tasks', icon: <ChecklistIcon sx={{ fontSize: 15 }} /> },
        { id: 'projects', label: 'Projects', icon: <FolderSpecialOutlinedIcon sx={{ fontSize: 15 }} /> },
      ],
    },
    {
      title: 'SALES & CRM',
      items: [
        { id: 'sales', label: 'Sales & Pipeline', icon: <TrendingUpIcon sx={{ fontSize: 15 }} /> },
      ],
    },
    {
      title: 'PEOPLE & HR',
      items: [
        { id: 'team', label: 'Team', icon: <PeopleIcon sx={{ fontSize: 15 }} /> },
        { id: 'attendance', label: 'Attendance', icon: <AccessTimeIcon sx={{ fontSize: 15 }} /> },
      ],
    },
    {
      title: 'COLLABORATION',
      items: [
        { id: 'meetings', label: 'Meetings', icon: <VideocamOutlinedIcon sx={{ fontSize: 15 }} /> },
        { id: 'chat', label: 'Chat', icon: <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 15 }} /> },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'reports', label: 'Reports', icon: <BarChartOutlinedIcon sx={{ fontSize: 15 }} /> },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'admin', label: 'Admin', icon: <SettingsOutlinedIcon sx={{ fontSize: 15 }} /> },
      ],
    },
  ];

  return (
    <Box
      sx={{
        width: { xs: '100%', md: '180px' },
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isDark
          ? 'linear-gradient(180deg, #131117 0%, #1a1721 65%, #0f0d12 100%)'
          : 'linear-gradient(180deg, #1c1825 0%, #24202e 65%, #18151f 100%)',
        color: '#E8E4EF',
        borderRight: isDark
          ? '1px solid rgba(255, 255, 255, 0.05)'
          : '1px solid rgba(0, 0, 0, 0.08)',
        transition: 'background 0.25s ease, border-color 0.25s ease',
        userSelect: 'none',
      }}
    >
      {/* Brand Workspace Header */}
      <Box sx={{ p: 1, pb: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 0.85,
            borderRadius: '10px',
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Box
            component="img"
            src="/logo/leapsofts-white.png"
            alt="Leapsofts"
            sx={{ width: 22, height: 22, borderRadius: '5px', objectFit: 'contain' }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.74rem',
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
              }}
              noWrap
            >
              Leapsofts
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.42)',
                fontSize: '0.6rem',
                fontWeight: 500,
              }}
              noWrap
            >
              Enterprise
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Groups */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 0.85,
          py: 0.25,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {navGroups.map((group) => (
          <Box key={group.title} sx={{ mb: 1 }}>
            <Typography
              sx={{
                display: 'block',
                px: 1,
                mb: 0.25,
                fontSize: '0.55rem',
                fontWeight: 750,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.32)',
              }}
            >
              {group.title}
            </Typography>

            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.15 }}>
              {group.items.map((item) => {
                const isSelected = activePage === item.id;
                return (
                  <ListItem key={item.id} disablePadding>
                    <ListItemButton
                      onClick={() => onSelectPage(item.id)}
                      sx={{
                        borderRadius: '8px',
                        py: 0.45,
                        px: 1,
                        color: isSelected ? '#FFFFFF' : 'rgba(232, 228, 239, 0.65)',
                        bgcolor: isSelected
                          ? 'rgba(93, 26, 137, 0.28)'
                          : 'transparent',
                        border: '1px solid',
                        borderColor: isSelected
                          ? 'rgba(168, 85, 247, 0.35)'
                          : 'transparent',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: isSelected
                            ? 'rgba(93, 26, 137, 0.38)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: '#FFFFFF',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 22,
                          color: isSelected ? tokens.brand.accent : 'rgba(255, 255, 255, 0.55)',
                          transition: 'color 0.15s',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.72rem',
                          fontWeight: isSelected ? 750 : 500,
                          letterSpacing: '-0.01em',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom User Profile: Huzaifa Rasheed */}
      <Box
        sx={{
          p: 1,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.12)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, minWidth: 0 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: tokens.brand.primary,
              backgroundImage: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.primaryLight})`,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.65rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            HR
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: '#FFFFFF',
                fontWeight: 750,
                fontSize: '0.7rem',
                lineHeight: 1.15,
              }}
              noWrap
            >
              Huzaifa Rasheed
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: '0.58rem',
                display: 'block',
              }}
              noWrap
            >
              huzaifa@leapsofts.com
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.45)',
            p: 0.25,
            transition: 'color 0.2s',
            '&:hover': { color: '#FFFFFF' },
          }}
        >
          <SettingsOutlinedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </Box>
  );
};
