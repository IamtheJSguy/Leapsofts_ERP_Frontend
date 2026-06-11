import { useState, useMemo } from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  Badge,
  Box,
  Typography,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useConversations } from '@/hooks/api/useChat';
import { useChatStore } from '@/store/useChatStore';
import { getDisplayName, formatDateTime } from '@/utils/formatters';
import { EmptyState } from '@/components/common/EmptyState';
import { tokens } from '@/styles/tokens';
import { useAuth } from '@/hooks/useAuth';

import { useUsers } from '@/hooks/api/useUsers';

export const ChatSidebar = () => {
  const { user: currentUser } = useAuth();
  const { data: conversations = [] } = useConversations();
  const { data: dbUsers = [] } = useUsers();
  const { activeConversationId, setActiveConversation } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Construct mock conversations using real DB users if the API conversations list is empty
  const mockConversations = useMemo(() => {
    if (conversations.length > 0) return conversations;
    
    // Find all users from the DB that are not the current user
    const otherUsers = dbUsers.filter((u) => u._id !== currentUser?._id);
    if (otherUsers.length === 0) return [];

    const fallbackMessages = [
      "Hey! Did you check the new ICP filters for the campaign?",
      "Sure, I'll send the updated pitch deck shortly.",
      "Just finished calling the lead from yesterday. They're interested!",
      "I'm scheduling the demo meeting for this Thursday.",
      "Can you review the Google Sheets sync status when you get a chance?",
      "Good morning, here is my daily target update.",
    ];

    return otherUsers.map((u, idx) => {
      const convId = `mock-conv-${u._id}`;
      const msgId = `mock-msg-${u._id}`;
      const text = fallbackMessages[idx % fallbackMessages.length];
      const time = new Date(Date.now() - idx * 3600000).toISOString();

      const lastMessage: any = {
        _id: msgId,
        conversationId: convId,
        sender: u,
        content: text,
        type: 'text',
        createdAt: time,
      };

      return {
        _id: convId,
        participants: [currentUser!, u],
        lastMessage,
        unreadCount: idx === 0 ? 2 : 0,
        updatedAt: time,
      };
    });
  }, [conversations, dbUsers, currentUser]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    return mockConversations.filter((conv) => {
      const names = conv.participants
        .filter((p) => p._id !== currentUser?._id)
        .map((p) => getDisplayName(p))
        .join(', ');
      return names.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (conv.lastMessage?.content && conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [mockConversations, searchQuery, currentUser]);

  const getChatDetails = (conv: any) => {
    // Get details of the other participants (excluding current user)
    const otherParticipants = conv.participants.filter((p: any) => p._id !== currentUser?._id);
    const mainParticipant = otherParticipants[0] || conv.participants[0] || currentUser;
    const name = otherParticipants.map((p: any) => getDisplayName(p)).join(', ') || getDisplayName(mainParticipant);
    const email = mainParticipant?.email || '';
    const initial = name.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';
    
    // Simulate active status (e.g. if the user is active)
    const isOnline = mainParticipant?.isActive || mainParticipant?.status === 'active' || false;
    
    return { name, email, initial, isOnline };
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        borderRight: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
        bgcolor: isDarkMode ? 'rgba(24, 20, 31, 0.2)' : 'rgba(0, 0, 0, 0.005)',
      }}
    >
      {/* Sidebar Search Bar */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Search chats..."
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              height: 38,
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff',
              fontSize: '0.8rem',
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              },
              '&:hover fieldset': {
                borderColor: tokens.brand.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: tokens.brand.primary,
              },
            },
          }}
        />
      </Box>

      <Divider sx={{ opacity: 0.3 }} />

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredConversations.length === 0 ? (
          <Box sx={{ py: 6, px: 2 }}>
            <EmptyState 
              title={conversations.length === 0 ? "No active chats" : "No chats found"} 
              description={conversations.length === 0 ? "Search for members to start chatting." : "Try searching for another team member."} 
            />
          </Box>
        ) : (
          <List disablePadding sx={{ py: 1 }}>
            {filteredConversations.map((conv) => {
              const active = activeConversationId === conv._id;
              const details = getChatDetails(conv);
              const unreadCount = conv.unreadCount || 0;

              return (
                <ListItemButton
                  key={conv._id}
                  selected={active}
                  onClick={() => setActiveConversation(conv._id)}
                  sx={{
                    px: 2.25,
                    py: 1.75,
                    mb: 0.5,
                    mx: 1,
                    borderRadius: '16px',
                    position: 'relative',
                    bgcolor: 'transparent',
                    borderLeft: `4px solid ${active ? tokens.brand.primary : 'transparent'}`,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.08)' : 'rgba(93, 26, 137, 0.04)',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.12)' : 'rgba(93, 26, 137, 0.06)',
                      },
                    },
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)',
                    },
                  }}
                >
                  {/* Left Avatar with Pulsing Status Indicator */}
                  <Box sx={{ mr: 2, position: 'relative' }}>
                    <Avatar
                      sx={{
                        width: 42,
                        height: 42,
                        bgcolor: active ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(93, 26, 137, 0.05)'),
                        color: active ? '#fff' : tokens.brand.primary,
                        fontSize: '0.94rem',
                        fontWeight: 700,
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      }}
                    >
                      {details.initial}
                    </Avatar>
                    {details.isOnline && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 11,
                          height: 11,
                          borderRadius: '50%',
                          bgcolor: tokens.semantic.success,
                          border: `2px solid ${isDarkMode ? '#1e1b24' : '#fff'}`,
                          animation: 'pulse 1.8s infinite ease-in-out',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(0.95)', opacity: 0.8 },
                            '50%': { transform: 'scale(1.2)', opacity: 1 },
                            '100%': { transform: 'scale(0.95)', opacity: 0.8 },
                          },
                        }}
                      />
                    )}
                  </Box>

                  {/* Text details */}
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.86rem',
                            color: active ? tokens.brand.primary : (isDarkMode ? '#fff' : tokens.text.primary),
                            lineHeight: 1.2,
                          }}
                          noWrap
                        >
                          {details.name}
                        </Typography>
                        {conv.updatedAt && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: active ? tokens.brand.primary : 'text.secondary',
                              opacity: active ? 0.85 : 0.6,
                              fontSize: '0.68rem',
                              fontWeight: 500,
                            }}
                          >
                            {formatDateTime(conv.updatedAt).split(' ')[0]}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.76rem',
                            fontWeight: unreadCount > 0 ? 700 : 500,
                            maxWidth: unreadCount > 0 ? '80%' : '100%',
                          }}
                          noWrap
                        >
                          {conv.lastMessage?.content || 'No messages yet.'}
                        </Typography>
                        {unreadCount > 0 && (
                          <Badge
                            badgeContent={unreadCount}
                            sx={{
                              '& .MuiBadge-badge': {
                                bgcolor: tokens.brand.accent,
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '0.64rem',
                                height: 16,
                                minWidth: 16,
                                borderRadius: '8px',
                              },
                            }}
                          />
                        )}
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};
