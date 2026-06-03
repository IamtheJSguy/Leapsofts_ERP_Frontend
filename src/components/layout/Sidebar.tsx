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
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChatIcon from '@mui/icons-material/Chat';
import EventIcon from '@mui/icons-material/Event';
import SpeedIcon from '@mui/icons-material/Speed';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_NAME } from '@/lib/constants';
import { tokens } from '@/styles/tokens';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Leads', path: '/leads', icon: <ContactPageIcon fontSize="small" /> },
  { label: 'Kanban', path: '/kanban', icon: <ViewKanbanIcon fontSize="small" /> },
  { label: 'KPIs', path: '/kpis', icon: <SpeedIcon fontSize="small" /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon fontSize="small" /> },
  { label: 'Meetings', path: '/meetings', icon: <EventIcon fontSize="small" /> },
  { label: 'Chat', path: '/chat', icon: <ChatIcon fontSize="small" /> },
  { label: 'Admin', path: '/admin', icon: <AdminPanelSettingsIcon fontSize="small" />, adminOnly: true },
];

const BrandMark = () => (
  <Box
    sx={{
      width: 42,
      height: 42,
      borderRadius: 2,
      background: `linear-gradient(135deg, ${tokens.brand.primary} 0%, ${tokens.brand.primaryLight} 55%, ${tokens.brand.accent} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `0 4px 14px ${alpha(tokens.brand.primary, 0.45)}`,
    }}
    aria-hidden
  >
    <Typography
      component="span"
      sx={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '-0.02em' }}
    >
      B2
    </Typography>
  </Box>
);

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { canManageUsers } = usePermissions();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const filteredItems = navItems.filter((item) => !item.adminOnly || canManageUsers);

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: tokens.surface.sidebar,
        color: tokens.text.sidebar,
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${alpha('#fff', 0.06)}`,
        }}
      >
        <BrandMark />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: tokens.text.inverse,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
            noWrap
          >
            {APP_NAME}
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.text.inverseMuted }}>
            LEAP SOFTS
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {filteredItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={() => isMobile && toggleSidebar()}
                sx={{
                  borderRadius: tokens.radius.pill,
                  py: 1.25,
                  px: 2,
                  color: tokens.text.sidebarMuted,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: tokens.surface.sidebarHover,
                    color: tokens.text.inverse,
                  },
                  ...(isActive && {
                    bgcolor: tokens.surface.sidebarActive,
                    color: tokens.text.inverse,
                    '& .MuiListItemIcon-root': {
                      color: tokens.brand.accent,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 20,
                      borderRadius: 2,
                      bgcolor: tokens.brand.accent,
                    },
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderTop: `1px solid ${alpha('#fff', 0.06)}`,
        }}
      >
        <Box
          className="login-accent-bar"
          sx={{ height: 3, borderRadius: tokens.radius.pill, mb: 1.5, opacity: 0.9 }}
        />
        <Typography variant="caption" sx={{ color: tokens.text.inverseMuted }}>
          B2B Lead Generation
        </Typography>
      </Box>
    </Box>
  );

  const paperSx = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box' as const,
    border: 'none',
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
