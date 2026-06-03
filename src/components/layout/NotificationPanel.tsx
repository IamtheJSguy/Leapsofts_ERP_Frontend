import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Badge,
  Divider,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/api/useNotifications';
import { useUIStore } from '@/store/useUIStore';
import { formatDateTime } from '@/utils/formatters';
import { EmptyState } from '@/components/common/EmptyState';

export const NotificationPanel = () => {
  const { notificationPanelOpen, setNotificationPanelOpen } = useUIStore();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  return (
    <Drawer
      anchor="right"
      open={notificationPanelOpen}
      onClose={() => setNotificationPanelOpen(false)}
    >
      <Box sx={{ width: 360, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            <Button size="small" onClick={() => markAllAsRead.mutate()} sx={{ mr: 1 }}>
              Mark all read
            </Button>
            <IconButton
              onClick={() => setNotificationPanelOpen(false)}
              aria-label="Close notifications"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up." />
        ) : (
          <List disablePadding>
            {notifications.map((n) => (
              <ListItem key={n._id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => !n.isRead && markAsRead.mutate(n._id)}
                  sx={{ bgcolor: n.isRead ? 'transparent' : 'action.hover', borderRadius: 1 }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!n.isRead && <Badge variant="dot" color="primary" />}
                        {n.title}
                      </Box>
                    }
                    secondary={
                      <>
                        {n.message}
                        <Typography variant="caption" display="block">
                          {formatDateTime(n.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};
