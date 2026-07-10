import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
  IconButton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChatIcon from '@mui/icons-material/Chat';
import EventIcon from '@mui/icons-material/Event';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/useAuthStore';
import { APP_NAME } from '@/lib/constants';
import { tokens } from '@/styles/tokens';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiresPermission?: 'canViewTeamDashboard' | 'canViewAdminReports' | 'canViewSystemSettings';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', path: '/', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
      { label: 'Tasks', path: '/tasks', icon: <FormatListBulletedIcon sx={{ fontSize: 18 }} /> },
      { label: 'Sales & Pipeline', path: '/sales', icon: <TrendingUpIcon sx={{ fontSize: 18 }} /> },
      { label: 'Attendance', path: '/attendance', icon: <AccessTimeIcon sx={{ fontSize: 18 }} /> },
      // { label: 'Leads', path: '/leads', icon: <ContactPageIcon sx={{ fontSize: 18 }} /> },
      { label: 'Projects', path: '/projects', icon: <ViewKanbanIcon sx={{ fontSize: 18 }} /> },
      { label: 'Team', path: '/team', icon: <PeopleIcon sx={{ fontSize: 18 }} />, requiresPermission: 'canViewTeamDashboard' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      // { label: 'KPIs', path: '/kpis', icon: <SpeedIcon sx={{ fontSize: 18 }} /> },
      { label: 'Reports', path: '/reports', icon: <AssessmentIcon sx={{ fontSize: 18 }} />, requiresPermission: 'canViewAdminReports' },
    ],
  },
  {
    title: 'Collaboration',
    items: [
      { label: 'Meetings', path: '/meetings', icon: <EventIcon sx={{ fontSize: 18 }} /> },
      { label: 'Chat', path: '/chat', icon: <ChatIcon sx={{ fontSize: 18 }} /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Admin', path: '/admin', icon: <AdminPanelSettingsIcon sx={{ fontSize: 18 }} />, requiresPermission: 'canViewSystemSettings' },
    ],
  },
];

const BrandMark = () => (
  <Box
    sx={{
      width: 36,
      height: 36,
      borderRadius: '8px',
      background: `linear-gradient(135deg, ${tokens.brand.primary} 0%, ${tokens.brand.primaryLight} 60%, ${tokens.brand.accent} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `0 4px 10px ${alpha(tokens.brand.primary, 0.35)}`,
    }}
    aria-hidden
  >
    <Typography
      component="span"
      sx={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '-0.03em' }}
    >
      LS
    </Typography>
  </Box>
);

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  const user = useAuthStore((s) => s.user);
  const userInitial = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : 'U';
  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || 'Leapsofts User';
  const userEmail = user?.email || 'user@leapsofts.com';

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isDarkMode
          ? 'linear-gradient(180deg, #131117 0%, #1a1721 65%, #0f0d12 100%)'
          : 'linear-gradient(180deg, #1c1825 0%, #24202e 65%, #18151f 100%)',
        color: '#E8E4EF',
        borderRadius: 0,
      }}
    >
      {/* Workspace Selector Dropdown Header */}
      <Box sx={{ px: 2, pt: 3, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1.25,
            borderRadius: '12px',
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <BrandMark />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  lineHeight: 1.2,
                  letterSpacing: '-0.015em',
                }}
                noWrap
              >
                {APP_NAME}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.45)',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
                noWrap
              >
                Enterprise Workspace
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Grouped Navigation Lists */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 1.5,
          scrollbarWidth: 'none', // Firefox
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome, Safari, Edge
          },
          msOverflowStyle: 'none', // IE
        }}
      >
        {navGroups.map((group, groupIdx) => {
          // Filter items based on permissions
          const filteredItems = group.items.filter(
            (item) => !item.requiresPermission || permissions[item.requiresPermission]
          );

          if (filteredItems.length === 0) return null;

          return (
            <Box key={group.title} sx={{ mb: groupIdx === navGroups.length - 1 ? 0 : 3 }}>
              {/* Category Header Label */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  px: 1.5,
                  mb: 1,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255, 255, 255, 0.32)',
                }}
              >
                {group.title}
              </Typography>

              {/* Group Items */}
              <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {filteredItems.map((item) => {
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <ListItem key={item.path} disablePadding>
                      <ListItemButton
                        component={NavLink}
                        to={item.path}
                        onClick={() => isMobile && toggleSidebar()}
                        sx={{
                          borderRadius: '10px',
                          border: '1px solid transparent',
                          py: 1,
                          px: 1.5,
                          color: 'rgba(232, 228, 239, 0.65)',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.03)',
                            borderColor: 'rgba(255, 255, 255, 0.04)',
                            color: '#FFFFFF',
                          },
                          ...(isActive && {
                            bgcolor: 'rgba(93, 26, 137, 0.12)',
                            borderColor: alpha(tokens.brand.primary, 0.25),
                            color: '#FFFFFF',
                            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.02)',
                            '& .MuiListItemIcon-root': {
                              color: tokens.brand.accent,
                            },
                            '&:hover': {
                              bgcolor: 'rgba(93, 26, 137, 0.16)',
                              borderColor: alpha(tokens.brand.primary, 0.35),
                            }
                          }),
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 28,
                            color: 'inherit',
                            transition: 'color 0.25s',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.84rem',
                            fontWeight: isActive ? 700 : 500,
                            letterSpacing: '-0.01em',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* User Account profile panel */}
      <Box
        sx={{
          px: 2.5,
          py: 2.25,
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 'auto',
          bgcolor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: tokens.brand.primary,
              backgroundImage: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.primaryLight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: '2px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {userInitial}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.2 }}
              noWrap
            >
              {userName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem', display: 'block' }}
              noWrap
            >
              {userEmail}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.4)',
            transition: 'color 0.2s',
            '&:hover': { color: '#FFFFFF' },
          }}
          onClick={() => navigate('/profile')}
        >
          <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );

  const paperSx = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box' as const,
    border: 'none',
    borderRadius: 0,
    boxShadow: tokens.shadow.sidebar,
  };

  return isMobile ? (
    <Drawer
      variant="temporary"
      open={sidebarOpen}
      onClose={toggleSidebar}
      PaperProps={{ sx: paperSx }}
    >
      {drawerContent}
    </Drawer>
  ) : (
    <Drawer
      variant="persistent"
      open={sidebarOpen}
      sx={{
        width: sidebarOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': paperSx,
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export { DRAWER_WIDTH };
