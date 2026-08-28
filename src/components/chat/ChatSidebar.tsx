import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
  Dialog,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCommentIcon from '@mui/icons-material/AddComment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useConversations, useCreateConversation, useUpdatePresence } from '@/hooks/api/useChat';
import { useChatStore } from '@/store/useChatStore';
import { getDisplayName, formatDateTime, getPresenceLabel } from '@/utils/formatters';
import { getMergedUnreadCount, conversationBoardId, getConversationTitle } from '@/utils/chatUnreadUtils';
import { useKanbanBoards } from '@/hooks/api/useKanban';
import { EmptyState } from '@/components/common/EmptyState';
import { tokens } from '@/styles/tokens';
import { PRESENCE_COLORS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/api/useUsers';
import { useSocket } from '@/hooks/useSocket';
import type { PresenceStatus } from '@/types';

export const ChatSidebar = () => {
  const { user: currentUser } = useAuth();
  const { data: conversations = [] } = useConversations();
  const { data: boards = [] } = useKanbanBoards();
  const { data: dbUsers = [] } = useUsers();
  const { activeConversationId, setActiveConversation, typingUsers, unreadCounts, clearUnread, presenceByUserId } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { subscribePresence } = useSocket();
  const updatePresence = useUpdatePresence();

  const { mutate: createConversation, isPending: isCreating } = useCreateConversation();
  const [selectedUserToChat, setSelectedUserToChat] = useState<any>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  // Group chat states
  const [chatTab, setChatTab] = useState(0); // 0 = Direct, 1 = Group
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  const ownPresence = currentUser?._id
    ? presenceByUserId[currentUser._id] || { status: 'online' as PresenceStatus }
    : { status: 'offline' as PresenceStatus };

  const participantIds = useMemo(() => {
    const ids = new Set<string>();
    conversations.forEach((conv) => {
      conv.participants.forEach((p: any) => {
        const id = typeof p === 'string' ? p : p._id;
        if (id && id !== currentUser?._id) ids.add(id);
      });
    });
    if (currentUser?._id) ids.add(currentUser._id);
    return Array.from(ids);
  }, [conversations, currentUser?._id]);

  useEffect(() => {
    if (participantIds.length) subscribePresence(participantIds);
  }, [participantIds, subscribePresence]);

  const boardNameById = useMemo(() => {
    const map: Record<string, string> = {};
    boards.forEach((b) => {
      if (b._id && b.name) map[b._id] = b.name;
    });
    return map;
  }, [boards]);

  const getChatDetails = (conv: any) => {
    if (conv.isGroup) {
      const boardId = conversationBoardId(conv);
      const name =
        getConversationTitle(conv, boardId ? boardNameById[boardId] : undefined) ||
        (boardId ? 'Board' : 'Group Chat');
      const initial = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'G';
      const onlineCount = conv.participants.filter((p: any) => {
        const id = typeof p === 'string' ? p : p._id;
        if (!id || id === currentUser?._id) return false;
        return (presenceByUserId[id]?.status || p?.presenceStatus || 'offline') === 'online';
      }).length;
      return {
        name,
        email: `${conv.participants.length} members`,
        initial,
        status: (onlineCount > 0 ? 'online' : 'offline') as PresenceStatus,
        presenceLabel: onlineCount > 0 ? `${onlineCount} online` : `${conv.participants.length} members`,
        isGroup: true,
      };
    }

    const otherParticipants = conv.participants.filter((p: any) => p._id !== currentUser?._id);
    const mainParticipant = otherParticipants[0] || conv.participants[0] || currentUser;
    const name = otherParticipants.map((p: any) => getDisplayName(p)).join(', ') || getDisplayName(mainParticipant);
    const email = mainParticipant?.email || '';
    const initial = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
    const mainId = typeof mainParticipant === 'object' ? mainParticipant?._id : mainParticipant;
    const fromStore = mainId ? presenceByUserId[mainId] : undefined;
    const status: PresenceStatus =
      fromStore?.status ||
      mainParticipant?.presenceStatus ||
      (mainParticipant?.isOnline ? 'online' : 'offline');
    const lastSeenAt = fromStore?.lastSeenAt || mainParticipant?.lastSeenAt;

    return {
      name,
      email,
      initial,
      status,
      presenceLabel: getPresenceLabel(status, lastSeenAt),
      isGroup: false,
    };
  };

  // Filter existing conversations based on search query
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const names = conv.isGroup
        ? (getConversationTitle(conv, conversationBoardId(conv) ? boardNameById[conversationBoardId(conv)!] : undefined) || conv.name || '')
        : conv.participants
          .filter((p: any) => p._id !== currentUser?._id)
          .map((p: any) => getDisplayName(p))
          .join(', ');
      return names.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.lastMessage?.content && conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()));
    }).map(conv => ({ ...conv, details: getChatDetails(conv) }));
  }, [conversations, searchQuery, currentUser, presenceByUserId, boardNameById]);

  const handleSetPresence = (status: 'away' | 'offline' | null) => {
    updatePresence.mutate(status);
    setStatusMenuAnchor(null);
  };

  // Filter dbUsers based on New Chat Search
  const filteredNewChatUsers = useMemo(() => {
    let users = dbUsers.filter((u) => u._id !== currentUser?._id);
    if (newChatSearch.trim()) {
      const query = newChatSearch.toLowerCase().trim();
      users = users.filter((u) => {
        const name = getDisplayName(u).toLowerCase();
        const email = u.email?.toLowerCase() || '';
        return name.includes(query) || email.includes(query);
      });
      // Sort to bring exact/closest matches to the top
      users.sort((a, b) => {
        const nameA = getDisplayName(a).toLowerCase();
        const nameB = getDisplayName(b).toLowerCase();
        if (nameA.startsWith(query) && !nameB.startsWith(query)) return -1;
        if (!nameA.startsWith(query) && nameB.startsWith(query)) return 1;
        return 0;
      });
    }
    return users;
  }, [dbUsers, newChatSearch, currentUser]);

  const handleCreateChat = () => {
    if (chatTab === 0) {
      if (!selectedUserToChat) return;
      createConversation(
        { participantId: selectedUserToChat._id },
        {
          onSuccess: (res) => {
            setSelectedUserToChat(null);
            setIsNewChatModalOpen(false);
            setNewChatSearch('');
            // If backend returns the new conv ID, set it active
            const newConvId = res.data?.data?._id || res.data?._id;
            if (newConvId) {
              setActiveConversation(newConvId);
              navigate(`/chat/${newConvId}`);
            }
          },
        }
      );
    } else {
      if (!groupName.trim() || selectedGroupMembers.length === 0) return;
      createConversation(
        {
          isGroup: true,
          name: groupName,
          description: groupDesc,
          participantIds: selectedGroupMembers
        } as any,
        {
          onSuccess: (res) => {
            setIsNewChatModalOpen(false);
            setGroupName('');
            setGroupDesc('');
            setSelectedGroupMembers([]);
            setNewChatSearch('');
            const newConvId = res.data?.data?._id || res.data?._id;
            if (newConvId) {
              setActiveConversation(newConvId);
              navigate(`/chat/${newConvId}`);
            }
          },
        }
      );
    }
  };



  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        bgcolor: 'transparent',
        borderRight: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
      }}
    >
      {/* Sidebar Header & Search Bar */}
      <Box sx={{ p: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={`Your status: ${getPresenceLabel(ownPresence.status, ownPresence.lastSeenAt)}`} arrow>
          <IconButton
            onClick={(e) => setStatusMenuAnchor(e.currentTarget)}
            sx={{
              width: 38,
              height: 38,
              position: 'relative',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              color: tokens.brand.primary,
              fontWeight: 800,
              fontSize: '0.8rem',
            }}
            aria-label="Set chat status"
          >
            {(currentUser ? getDisplayName(currentUser) : 'Me').charAt(0).toUpperCase()}
            <Box
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: PRESENCE_COLORS[ownPresence.status] || PRESENCE_COLORS.offline,
                border: `2px solid ${isDarkMode ? '#1e1b24' : '#fff'}`,
              }}
            />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={statusMenuAnchor}
          open={Boolean(statusMenuAnchor)}
          onClose={() => setStatusMenuAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: '14px',
              minWidth: 180,
              bgcolor: isDarkMode ? '#25212e' : '#fff',
              backgroundImage: 'none',
            },
          }}
        >
          <MenuItem onClick={() => handleSetPresence('away')} sx={{ py: 1.25 }}>
            <ListItemIcon>
              <AccessTimeIcon fontSize="small" sx={{ color: PRESENCE_COLORS.away }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Away</Typography>
          </MenuItem>
          <MenuItem onClick={() => handleSetPresence('offline')} sx={{ py: 1.25 }}>
            <ListItemIcon>
              <DoNotDisturbOnIcon fontSize="small" sx={{ color: PRESENCE_COLORS.offline }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Offline</Typography>
          </MenuItem>
          <MenuItem onClick={() => handleSetPresence(null)} sx={{ py: 1.25 }}>
            <ListItemIcon>
              <RestartAltIcon fontSize="small" sx={{ color: PRESENCE_COLORS.online }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Clear (auto)</Typography>
          </MenuItem>
        </Menu>
        <TextField
          size="small"
          placeholder="Search chats..."
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 1 }}>
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderRadius: '20px',
            px: 2,
            py: 0.75,
            '& input': { fontSize: '0.85rem' }
          }}
        />
        <IconButton
          onClick={() => setIsNewChatModalOpen(true)}
          sx={{
            bgcolor: tokens.brand.primary,
            color: '#fff',
            width: 38,
            height: 38,
            '&:hover': { bgcolor: tokens.brand.primary }
          }}
        >
          <AddCommentIcon sx={{ fontSize: 18 }} />
        </IconButton>
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
            {filteredConversations.map((conv: any) => {
              const active = activeConversationId === conv._id;
              const details = conv.details;
              const unreadCount = getMergedUnreadCount(conv, unreadCounts);
              const typingUsersInConv = typingUsers[conv._id] || [];
              const otherTypingUsers = typingUsersInConv.filter((id) => id !== currentUser?._id);

              return (
                <ListItemButton
                  key={conv._id}
                  selected={active}
                  onClick={() => {
                    setActiveConversation(conv._id);
                    clearUnread(conv._id);
                    setSearchQuery('');
                    navigate(`/chat/${conv._id}`);
                  }}
                  sx={{
                    px: 2.25,
                    py: 1.75,
                    mb: 0.75,
                    mx: 2,
                    borderRadius: '20px',
                    position: 'relative',
                    bgcolor: active
                      ? (isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.08)')
                      : 'transparent',
                    boxShadow: active && !isDarkMode ? '0 4px 12px rgba(93,26,137,0.08)' : 'none',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s',
                    willChange: 'transform',
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.08)',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.12)',
                        transform: 'scale(1.02)',
                      },
                    },
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      transform: 'scale(1.02)',
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
                    {!details.isGroup && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 11,
                          height: 11,
                          borderRadius: '50%',
                          bgcolor: PRESENCE_COLORS[details.status as PresenceStatus] || PRESENCE_COLORS.offline,
                          border: `2px solid ${isDarkMode ? '#1e1b24' : '#fff'}`,
                          animation: details.status === 'online'
                            ? 'pulse 1.8s infinite ease-in-out'
                            : 'none',
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
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
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
                          {conv.boardId && (
                            <Chip
                              label="Board"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                ml: 0.75,
                                flexShrink: 0,
                                bgcolor: tokens.brand.primary + '22',
                                color: tokens.brand.primary,
                              }}
                            />
                          )}
                        </Box>
                        {(conv.lastMessageAt || conv.updatedAt) && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: active ? tokens.brand.primary : 'text.secondary',
                              opacity: active ? 0.85 : 0.6,
                              fontSize: '0.68rem',
                              fontWeight: 500,
                            }}
                          >
                            {formatDateTime(conv.lastMessageAt || conv.updatedAt).split(' ')[0]}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
                        {otherTypingUsers.length > 0 ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: tokens.brand.primary,
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              fontStyle: 'italic',
                              maxWidth: unreadCount > 0 ? '80%' : '100%',
                            }}
                            noWrap
                          >
                            Typing...
                          </Typography>
                        ) : (
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
                        )}
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

      {/* New Chat Global Search Modal */}
      <Dialog
        open={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '28px',
            bgcolor: isDarkMode ? '#13111a' : '#ffffff',
            backgroundImage: 'none',
            boxShadow: isDarkMode ? '0 24px 64px rgba(0,0,0,0.4)' : '0 24px 64px rgba(0,0,0,0.08)',
            width: '100%',
            maxWidth: 440,
            overflow: 'hidden',
            m: { xs: 2, sm: 3 }
          }
        }}
      >
        <Box sx={{ p: { xs: 2.5, sm: 4 }, pb: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, textAlign: 'center', letterSpacing: '-0.02em' }}>
            New Conversation
          </Typography>

          {/* Custom Segmented Control */}
          <Box
            sx={{
              display: 'flex',
              p: 0.5,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
              borderRadius: '20px',
              mb: 3,
            }}
          >
            {[
              { label: 'Direct', val: 0 },
              { label: 'Group Chat', val: 1 },
            ].map((tab) => (
              <Box
                key={tab.val}
                onClick={() => setChatTab(tab.val)}
                sx={{
                  flex: 1,
                  py: 1,
                  textAlign: 'center',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: chatTab === tab.val
                    ? (isDarkMode ? '#fff' : tokens.brand.primary)
                    : 'text.secondary',
                  bgcolor: chatTab === tab.val
                    ? (isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff')
                    : 'transparent',
                  boxShadow: chatTab === tab.val && !isDarkMode
                    ? '0 2px 8px rgba(0,0,0,0.04)'
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </Box>
            ))}
          </Box>

          {chatTab === 1 && (
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                fullWidth
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                InputProps={{ disableUnderline: true }}
                variant="standard"
                sx={{
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                  borderRadius: '16px',
                  px: 2,
                  py: 1.5,
                  '& input': { fontWeight: 600, fontSize: '0.9rem' }
                }}
              />
              <TextField
                fullWidth
                placeholder="Description (Optional)"
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                InputProps={{ disableUnderline: true }}
                variant="standard"
                sx={{
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                  borderRadius: '16px',
                  px: 2,
                  py: 1.5,
                  '& input': { fontSize: '0.9rem' }
                }}
              />
            </Box>
          )}

          <TextField
            fullWidth
            placeholder={chatTab === 0 ? "Search for a team member..." : "Search members to add..."}
            value={newChatSearch}
            onChange={(e) => setNewChatSearch(e.target.value)}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 1.5 }}>
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
              borderRadius: '16px',
              px: 2,
              py: 1.5,
              mb: 2,
              '& input': { fontSize: '0.9rem' }
            }}
          />
        </Box>

        <Box sx={{ px: { xs: 1, sm: 2 }, pb: { xs: 2, sm: 3 } }}>
          <List sx={{ maxHeight: 280, overflowY: 'auto', p: 0 }}>
            {filteredNewChatUsers.map((user, index) => {
              const name = getDisplayName(user);
              const initial = name.charAt(0).toUpperCase();

              const isTopMatch = chatTab === 0 && newChatSearch.trim().length > 0 && index === 0;
              const isSelectedGroupMember = selectedGroupMembers.includes(user._id);

              return (
                <ListItemButton
                  key={user._id}
                  onClick={() => {
                    if (chatTab === 0) {
                      setSelectedUserToChat(user);
                    } else {
                      setSelectedGroupMembers(prev =>
                        prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id]
                      );
                    }
                  }}
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 1.5,
                    mb: 1,
                    mx: { xs: 1, sm: 2 },
                    borderRadius: '18px',
                    bgcolor: isTopMatch
                      ? (isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.05)')
                      : (isSelectedGroupMember ? (isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb') : 'transparent'),
                    border: isTopMatch
                      ? `1px solid ${tokens.brand.primary}`
                      : '1px solid transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isTopMatch
                        ? (isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.08)')
                        : (isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb')
                    },
                  }}
                >
                  {chatTab === 1 && (
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      {isSelectedGroupMember ? (
                        <CheckCircleIcon sx={{ color: tokens.brand.primary, fontSize: 22 }} />
                      ) : (
                        <RadioButtonUncheckedIcon sx={{ color: 'text.secondary', fontSize: 22, opacity: 0.5 }} />
                      )}
                    </Box>
                  )}
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      mr: 2,
                      bgcolor: isTopMatch ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                      color: isTopMatch ? '#fff' : tokens.brand.primary,
                      fontWeight: 700,
                    }}
                  >
                    {initial}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: isTopMatch ? tokens.brand.primary : 'text.primary', letterSpacing: '-0.01em' }}>
                        {name}
                      </Typography>
                    }
                    secondary={<Typography variant="body2" noWrap sx={{ color: 'text.secondary', fontWeight: 500 }}>{user.email}</Typography>}
                    sx={{ overflow: 'hidden' }}
                  />
                </ListItemButton>
              );
            })}
            {filteredNewChatUsers.length === 0 && (
              <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 5 }}>
                No users found matching your search.
              </Typography>
            )}
          </List>

          {chatTab === 1 && (
            <Box sx={{ px: 2, pt: 2 }}>
              <Button
                fullWidth
                onClick={handleCreateChat}
                disabled={isCreating || !groupName.trim() || selectedGroupMembers.length === 0}
                variant="contained"
                sx={{
                  bgcolor: tokens.brand.primary,
                  color: '#fff',
                  borderRadius: '16px',
                  py: 1.5,
                  fontWeight: 800,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  boxShadow: '0 8px 24px rgba(93, 26, 137, 0.25)',
                  '&:hover': { bgcolor: tokens.brand.primaryDark, boxShadow: '0 12px 28px rgba(93, 26, 137, 0.35)' },
                  '&.Mui-disabled': {
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    color: 'text.disabled',
                    boxShadow: 'none',
                  }
                }}
              >
                {isCreating ? 'Creating...' : `Create Group (${selectedGroupMembers.length} members)`}
              </Button>
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Direct Chat Confirmation Dialog */}
      <Dialog
        open={Boolean(selectedUserToChat)}
        onClose={() => setSelectedUserToChat(null)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? '#1e1b24' : '#fff',
            backgroundImage: 'none',
            boxShadow: tokens.shadow.card,
            p: 1,
          }
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: tokens.brand.primary,
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 800,
              mx: 'auto',
              mb: 2
            }}
          >
            {selectedUserToChat ? getDisplayName(selectedUserToChat).charAt(0).toUpperCase() : ''}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Start Chat
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            Would you like to open a direct message with <strong>{selectedUserToChat ? getDisplayName(selectedUserToChat) : ''}</strong>?
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              onClick={() => setSelectedUserToChat(null)}
              sx={{
                color: 'text.primary',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderRadius: '16px',
                py: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleCreateChat}
              disabled={isCreating}
              variant="contained"
              sx={{
                bgcolor: tokens.brand.primary,
                borderRadius: '16px',
                py: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { bgcolor: tokens.brand.primaryLight, boxShadow: 'none' }
              }}
            >
              {isCreating ? 'Opening...' : 'Start Chat'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};
