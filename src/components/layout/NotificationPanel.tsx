import {
  Drawer,
  Typography,
  Box,
  IconButton,
  Button,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/api/useNotifications';
import { useUIStore } from '@/store/useUIStore';
import { formatDateTime } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';

export const NotificationPanel = () => {
  const { notificationPanelOpen, setNotificationPanelOpen } = useUIStore();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllAsRead.mutate();
    }
  };

  const getNotificationIcon = (_title: string) => {
    // Basic heuristic to assign icons if needed, or fallback to generic
    // In a real app with notification types, we'd use `n.type`
    return <NotificationsNoneOutlinedIcon sx={{ fontSize: 20 }} />;
  };

  return (
    <Drawer
      anchor="right"
      open={notificationPanelOpen}
      onClose={() => setNotificationPanelOpen(false)}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          bgcolor: isDarkMode ? alpha('#1E1B24', 0.85) : alpha('#FFFFFF', 0.9),
          backdropFilter: 'blur(24px)',
          borderLeft: `1px solid ${isDarkMode ? alpha('#FFFFFF', 0.08) : alpha('#000000', 0.06)}`,
          backgroundImage: 'none',
          boxShadow: isDarkMode ? '-8px 0 32px rgba(0,0,0,0.5)' : '-8px 0 32px rgba(0,0,0,0.05)',
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header Area */}
        <Box 
          sx={{ 
            p: 3, 
            pt: 4,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${isDarkMode ? alpha('#FFFFFF', 0.06) : alpha('#000000', 0.04)}`,
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: isDarkMode ? alpha('#1E1B24', 0.6) : alpha('#FFFFFF', 0.6),
            backdropFilter: 'blur(12px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 850, letterSpacing: '-0.03em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Box
                sx={{
                  bgcolor: alpha(tokens.brand.primary, 0.12),
                  color: tokens.brand.primary,
                  px: 1.2,
                  py: 0.4,
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <CircleIcon sx={{ fontSize: 6 }} />
                {unreadCount} New
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {notifications.length > 0 && (
              <Button 
                size="small" 
                onClick={handleMarkAllRead} 
                disabled={unreadCount === 0 || markAllAsRead.isPending}
                startIcon={<DoneAllOutlinedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  borderRadius: '12px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  color: unreadCount > 0 ? tokens.brand.primary : 'text.disabled',
                  bgcolor: unreadCount > 0 ? (isDarkMode ? alpha(tokens.brand.primary, 0.08) : alpha(tokens.brand.primary, 0.05)) : 'transparent',
                  '&:hover': {
                    bgcolor: unreadCount > 0 ? alpha(tokens.brand.primary, 0.15) : 'transparent',
                  }
                }}
              >
                Read all
              </Button>
            )}
            <IconButton
              onClick={() => setNotificationPanelOpen(false)}
              aria-label="Close notifications"
              sx={{
                flexShrink: 0,
                bgcolor: isDarkMode ? alpha('#FFF', 0.04) : alpha('#000', 0.02),
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: isDarkMode ? alpha('#FFF', 0.08) : alpha('#000', 0.05),
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isLoading ? (
            // Skeleton Loading State
            Array.from(new Array(4)).map((_, i) => (
              <Box 
                key={i} 
                sx={{ 
                  display: 'flex', gap: 2, p: 2, 
                  borderRadius: '16px', 
                  bgcolor: isDarkMode ? alpha('#FFF', 0.02) : alpha('#000', 0.02),
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              >
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: isDarkMode ? alpha('#FFF', 0.05) : alpha('#000', 0.05) }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ width: '60%', height: 16, borderRadius: '4px', bgcolor: isDarkMode ? alpha('#FFF', 0.05) : alpha('#000', 0.05), mb: 1 }} />
                  <Box sx={{ width: '90%', height: 12, borderRadius: '4px', bgcolor: isDarkMode ? alpha('#FFF', 0.05) : alpha('#000', 0.05), mb: 1 }} />
                  <Box sx={{ width: '30%', height: 10, borderRadius: '4px', bgcolor: isDarkMode ? alpha('#FFF', 0.05) : alpha('#000', 0.05) }} />
                </Box>
              </Box>
            ))
          ) : notifications.length === 0 ? (
            // Empty State
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6 }}>
              <Box 
                sx={{ 
                  width: 80, height: 80, 
                  borderRadius: '24px', 
                  bgcolor: isDarkMode ? alpha('#FFF', 0.03) : alpha('#000', 0.02),
                  border: `1px solid ${isDarkMode ? alpha('#FFF', 0.08) : alpha('#000', 0.05)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 3,
                  boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.02)'
                }}
              >
                <NotificationsNoneOutlinedIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                All caught up
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 200 }}>
                You have no new notifications right now. Enjoy the silence!
              </Typography>
            </Box>
          ) : (
            // Notification List
            notifications.map((n, index) => (
              <Fade in={true} timeout={300 + (index * 100)} key={n._id}>
                <Box
                  onClick={() => !n.isRead && markAsRead.mutate(n._id)}
                  sx={{
                    position: 'relative',
                    p: 2.5,
                    borderRadius: '20px',
                    display: 'flex',
                    gap: 2.5,
                    cursor: n.isRead ? 'default' : 'pointer',
                    bgcolor: !n.isRead 
                      ? (isDarkMode ? alpha(tokens.brand.primary, 0.06) : alpha(tokens.brand.primary, 0.03)) 
                      : (isDarkMode ? alpha('#FFF', 0.015) : '#FFFFFF'),
                    border: `1px solid ${
                      !n.isRead 
                        ? (isDarkMode ? alpha(tokens.brand.primary, 0.15) : alpha(tokens.brand.primary, 0.1))
                        : (isDarkMode ? alpha('#FFF', 0.04) : alpha('#000', 0.04))
                    }`,
                    boxShadow: !n.isRead && !isDarkMode ? '0 4px 20px rgba(93, 26, 137, 0.03)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      bgcolor: !n.isRead 
                        ? (isDarkMode ? alpha(tokens.brand.primary, 0.08) : alpha(tokens.brand.primary, 0.05))
                        : (isDarkMode ? alpha('#FFF', 0.03) : alpha('#000', 0.015)),
                      boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.06)',
                      borderColor: !n.isRead ? alpha(tokens.brand.primary, 0.25) : (isDarkMode ? alpha('#FFF', 0.08) : alpha('#000', 0.08)),
                    }
                  }}
                >
                  {/* Unread Indicator Dot */}
                  {!n.isRead && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: '50%', left: 0, 
                        transform: 'translate(-50%, -50%)', 
                        width: 8, height: 8, 
                        borderRadius: '50%', 
                        bgcolor: tokens.brand.primary,
                        boxShadow: `0 0 10px ${alpha(tokens.brand.primary, 0.5)}`
                      }} 
                    />
                  )}

                  {/* Icon Container */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '14px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: !n.isRead ? tokens.brand.primary : 'text.secondary',
                      bgcolor: !n.isRead 
                        ? (isDarkMode ? alpha(tokens.brand.primary, 0.15) : alpha(tokens.brand.primary, 0.08))
                        : (isDarkMode ? alpha('#FFF', 0.05) : alpha('#000', 0.04)),
                    }}
                  >
                    {getNotificationIcon(n.title)}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0, pt: 0.2 }}>
                    <Typography 
                      variant="subtitle2" 
                      noWrap 
                      sx={{ 
                        fontWeight: !n.isRead ? 800 : 650, 
                        color: isDarkMode ? '#FFF' : tokens.text.primary,
                        mb: 0.5,
                        letterSpacing: '-0.01em',
                        fontSize: '0.92rem'
                      }}
                    >
                      {n.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary', 
                        lineHeight: 1.4,
                        mb: 1.5,
                        fontSize: '0.84rem'
                      }}
                    >
                      {n.message}
                    </Typography>
                    
                    {/* Timestamp */}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: !n.isRead ? tokens.brand.primary : 'text.disabled',
                        fontWeight: 750,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontSize: '0.65rem'
                      }}
                    >
                      {formatDateTime(n.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
