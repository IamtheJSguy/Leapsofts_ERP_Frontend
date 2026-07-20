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
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/api/useNotifications';
import { useUIStore } from '@/store/useUIStore';
import { formatDateTime } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';
import { NOTIFICATION_TYPE } from '@/lib/constants';

export const NotificationPanel = () => {
  const navigate = useNavigate();
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

  const getNotificationIcon = (notification: { title: string; type?: string }) => {
    if (notification.type === NOTIFICATION_TYPE.KANBAN_COMMENT_MENTION) {
      return <AlternateEmailIcon sx={{ fontSize: 20 }} />;
    }
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
          bgcolor: isDarkMode ? `color-mix(in srgb, #1E1B24 85%, transparent)` : `color-mix(in srgb, #FFFFFF 90%, transparent)`,
          /* backdropFilter: 'blur(24px)', (removed for performance) */
          borderLeft: `1px solid ${isDarkMode ? `color-mix(in srgb, #FFFFFF 8%, transparent)` : `color-mix(in srgb, #000000 6%, transparent)`}`,
          backgroundImage: 'none',
          boxShadow: isDarkMode ? '-8px 0 32px rgba(0,0,0,0.5)' : '-8px 0 32px rgba(0,0,0,0.05)',
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header Area */}
        <Box 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            pt: { xs: 3, sm: 4 },
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${isDarkMode ? `color-mix(in srgb, #FFFFFF 6%, transparent)` : `color-mix(in srgb, #000000 4%, transparent)`}`,
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: isDarkMode ? `color-mix(in srgb, #1E1B24 95%, transparent)` : `color-mix(in srgb, #FFFFFF 95%, transparent)`,
            /* backdropFilter: 'blur(12px)', (removed for performance) */
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
            <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 850, letterSpacing: '-0.03em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Box
                sx={{
                  bgcolor: `color-mix(in srgb, ${tokens.brand.primary} 12%, transparent)`,
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
          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
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
                  bgcolor: unreadCount > 0 ? (isDarkMode ? `color-mix(in srgb, ${tokens.brand.primary} 8%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 5%, transparent)`) : 'transparent',
                  '&:hover': {
                    bgcolor: unreadCount > 0 ? `color-mix(in srgb, ${tokens.brand.primary} 15%, transparent)` : 'transparent',
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
                bgcolor: isDarkMode ? `color-mix(in srgb, #FFF 4%, transparent)` : `color-mix(in srgb, #000 2%, transparent)`,
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: isDarkMode ? `color-mix(in srgb, #FFF 8%, transparent)` : `color-mix(in srgb, #000 5%, transparent)`,
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1.5, sm: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          {isLoading ? (
            // Skeleton Loading State
            Array.from(new Array(4)).map((_, i) => (
              <Box 
                key={i} 
                sx={{ 
                  display: 'flex', gap: 2, p: 2, 
                  borderRadius: '16px', 
                  bgcolor: isDarkMode ? `color-mix(in srgb, #FFF 2%, transparent)` : `color-mix(in srgb, #000 2%, transparent)`,
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              >
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: isDarkMode ? `color-mix(in srgb, #FFF 5%, transparent)` : `color-mix(in srgb, #000 5%, transparent)` }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ width: '60%', height: 16, borderRadius: '4px', bgcolor: isDarkMode ? `color-mix(in srgb, #FFF 5%, transparent)` : `color-mix(in srgb, #000 5%, transparent)`, mb: 1 }} />
                  <Box sx={{ width: '90%', height: 12, borderRadius: '4px', bgcolor: isDarkMode ? `color-mix(in srgb, #FFF 5%, transparent)` : `color-mix(in srgb, #000 5%, transparent)`, mb: 1 }} />
                  <Box sx={{ width: '30%', height: 10, borderRadius: '4px', bgcolor: isDarkMode ? `color-mix(in srgb, #FFF 5%, transparent)` : `color-mix(in srgb, #000 5%, transparent)` }} />
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
                  bgcolor: isDarkMode ? `color-mix(in srgb, #FFF 3%, transparent)` : `color-mix(in srgb, #000 2%, transparent)`,
                  border: `1px solid ${isDarkMode ? `color-mix(in srgb, #FFF 8%, transparent)` : `color-mix(in srgb, #000 5%, transparent)`}`,
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
                  onClick={() => {
                    if (!n.isRead) markAsRead.mutate(n._id);
                    if (n.type === NOTIFICATION_TYPE.APPROVAL_REQUIRED && (n as { metadata?: { changeRequestId?: string } }).metadata?.changeRequestId) {
                      setNotificationPanelOpen(false);
                      navigate('/tasks?tab=change_requests');
                    } else if (n.type === NOTIFICATION_TYPE.MEETING_REMINDER && (n as any).metadata?.meetingId) {
                      setNotificationPanelOpen(false);
                      navigate(`/meetings?meetingId=${(n as any).metadata.meetingId}`);
                    } else if (n.type === NOTIFICATION_TYPE.KANBAN_COMMENT_MENTION && (n as any).metadata?.boardId) {
                      setNotificationPanelOpen(false);
                      const m = (n as any).metadata;
                      navigate(`/projects/${m.projectId || m.boardId}/boards/${m.boardId}?card=${m.cardId}&comment=${m.commentId}`);
                    }
                  }}
                  sx={{
                    position: 'relative',
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: '20px',
                    display: 'flex',
                    gap: { xs: 1.5, sm: 2.5 },
                    cursor: n.isRead ? 'default' : 'pointer',
                    bgcolor: !n.isRead 
                      ? (isDarkMode ? `color-mix(in srgb, ${tokens.brand.primary} 6%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 3%, transparent)`) 
                      : (isDarkMode ? `color-mix(in srgb, #FFF 1.5%, transparent)` : '#FFFFFF'),
                    border: `1px solid ${
                      !n.isRead 
                        ? (isDarkMode ? `color-mix(in srgb, ${tokens.brand.primary} 15%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 10%, transparent)`)
                        : (isDarkMode ? `color-mix(in srgb, #FFF 4%, transparent)` : `color-mix(in srgb, #000 4%, transparent)`)
                    }`,
                    boxShadow: !n.isRead && !isDarkMode ? '0 4px 20px rgba(93, 26, 137, 0.03)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      bgcolor: !n.isRead 
                        ? (isDarkMode ? `color-mix(in srgb, ${tokens.brand.primary} 8%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 5%, transparent)`)
                        : (isDarkMode ? `color-mix(in srgb, #FFF 3%, transparent)` : `color-mix(in srgb, #000 1.5%, transparent)`),
                      boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.06)',
                      borderColor: !n.isRead ? `color-mix(in srgb, ${tokens.brand.primary} 25%, transparent)` : (isDarkMode ? `color-mix(in srgb, #FFF 8%, transparent)` : `color-mix(in srgb, #000 8%, transparent)`),
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
                        boxShadow: `0 0 10px ${`color-mix(in srgb, ${tokens.brand.primary} 50%, transparent)`}`
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
                        ? (isDarkMode ? `color-mix(in srgb, ${tokens.brand.primary} 15%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 8%, transparent)`)
                        : (isDarkMode ? `color-mix(in srgb, #FFF 5%, transparent)` : `color-mix(in srgb, #000 4%, transparent)`),
                    }}
                  >
                    {getNotificationIcon(n)}
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
