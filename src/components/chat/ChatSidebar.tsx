import { List, ListItemButton, ListItemText, Badge, Box, Typography } from '@mui/material';
import { useConversations } from '@/hooks/api/useChat';
import { useChatStore } from '@/store/useChatStore';
import { getDisplayName, formatDateTime } from '@/utils/formatters';
import { EmptyState } from '@/components/common/EmptyState';

export const ChatSidebar = () => {
  const { data: conversations = [] } = useConversations();
  const { activeConversationId, setActiveConversation } = useChatStore();

  if (conversations.length === 0) {
    return <EmptyState title="No conversations" description="Start a new chat." />;
  }

  return (
    <List disablePadding>
      {conversations.map((conv) => (
        <ListItemButton
          key={conv._id}
          selected={activeConversationId === conv._id}
          onClick={() => setActiveConversation(conv._id)}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {conv.participants.map((p) => getDisplayName(p)).join(', ')}
                {(conv.unreadCount || 0) > 0 && (
                  <Badge badgeContent={conv.unreadCount} color="primary" />
                )}
              </Box>
            }
            secondary={
              <>
                {conv.lastMessage?.content}
                <Typography variant="caption" display="block">
                  {conv.updatedAt && formatDateTime(conv.updatedAt)}
                </Typography>
              </>
            }
          />
        </ListItemButton>
      ))}
    </List>
  );
};
