import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Avatar,
  Typography,
  CircularProgress,
  useTheme,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import ForumIcon from '@mui/icons-material/Forum';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AddToDriveIcon from '@mui/icons-material/AddToDrive';
import ImageIcon from '@mui/icons-material/Image';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useMessages, useSendMessage, useConversations, useCreateConversation } from '@/hooks/api/useChat';
import { useUsers } from '@/hooks/api/useUsers';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { GroupSettingsModal } from './GroupSettingsModal';
import { DriveFilePicker } from './DriveFilePicker';
import { tokens } from '@/styles/tokens';
import { getDisplayName } from '@/utils/formatters';

interface ChatWindowProps {
  onSearchOpen?: () => void;
  onDriveOpen?: () => void;
}

export const ChatWindow = ({ onSearchOpen, onDriveOpen }: ChatWindowProps) => {
  const { activeConversationId, setActiveConversation } = useChatStore();
  const { user } = useAuth();
  const { data: conversations = [] } = useConversations();
  const { data: dbUsers = [] } = useUsers();
  const { data: messages = [], isLoading } = useMessages(activeConversationId);
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { joinChat, leaveChat, emitTyping } = useSocket();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Track typing
  const typingUsers = useChatStore((s) => activeConversationId ? s.typingUsers[activeConversationId] : undefined);
  const otherTypingUsers = (typingUsers || []).filter((id) => id !== user?._id);
  const lastTypingEmit = useRef<number>(0);

  // Attachment Menu State
  const [attachAnchorEl, setAttachAnchorEl] = useState<null | HTMLElement>(null);
  const isAttachMenuOpen = Boolean(attachAnchorEl);

  // Drive File Picker State
  const [drivePickerOpen, setDrivePickerOpen] = useState(false);

  // Group Settings State
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  useEffect(() => {
    if (activeConversationId) {
      joinChat(activeConversationId);
      return () => leaveChat(activeConversationId);
    }
  }, [activeConversationId, joinChat, leaveChat]);

  // Intercept and generate mock messages if this is a mock conversation
  const mockMessages = useMemo(() => {
    if (!activeConversationId) return [];
    if (!activeConversationId.startsWith('mock-conv-')) {
      return messages;
    }

    const targetUserId = activeConversationId.replace('mock-conv-', '');
    const targetUser = dbUsers.find((u) => u._id === targetUserId);
    if (!targetUser) return [];

    const messageSequences = [
      [
        { sender: targetUser, content: `Hi ${user?.firstName || 'there'}! I was checking the new lead parameters.` },
        { sender: user, content: "Hey! Yes, I updated them this morning. Do they look correct?" },
        { sender: targetUser, content: "Yes! They look much better. I've already filtered 50 profiles." },
        { sender: targetUser, content: "Hey! Did you check the new ICP filters for the campaign?" }
      ],
      [
        { sender: user, content: "Hi! Can you share the pitch deck?" },
        { sender: targetUser, content: "Yes, sure! I am working on the final slide right now." },
        { sender: targetUser, content: "Sure, I'll send the updated pitch deck shortly." }
      ],
      [
        { sender: targetUser, content: "We got a new inbound request." },
        { sender: user, content: "Awesome! Did you assign it?" },
        { sender: targetUser, content: "Just finished calling the lead from yesterday. They're interested!" }
      ],
      [
        { sender: user, content: "Morning! What's the status of the meeting scheduling?" },
        { sender: targetUser, content: "Doing outreach now. Sent booking links to 5 hot prospects." },
        { sender: targetUser, content: "I'm scheduling the demo meeting for this Thursday." }
      ],
    ];

    const userIdx = dbUsers.findIndex((u) => u._id === targetUserId);
    const sequence = messageSequences[userIdx >= 0 ? userIdx % messageSequences.length : 0] || messageSequences[0];

    return sequence.map((msg, idx) => ({
      _id: `mock-msg-${targetUserId}-${idx}`,
      conversationId: activeConversationId,
      sender: msg.sender as any,
      content: msg.content,
      type: 'text' as const,
      createdAt: new Date(Date.now() - (sequence.length - idx) * 900000).toISOString(),
    }));
  }, [messages, activeConversationId, dbUsers, user]);

  const displayMessages = activeConversationId?.startsWith('mock-conv-') ? mockMessages : messages;
  const showLoader = isLoading && !activeConversationId?.startsWith('mock-conv-');

  // Memoize user lookup map for O(1) sender resolution
  const userMap = useMemo(() => {
    const map = new Map();
    dbUsers.forEach((u) => map.set(u._id, u));
    return map;
  }, [dbUsers]);

  // Memoize enhanced messages list so it doesn't recalculate on every keystroke
  const enhancedMessages = useMemo(() => {
    return displayMessages.map((msg: any) => {
      const senderRef = msg.sender || msg.senderId;
      const senderObj = typeof senderRef === 'string' ? (userMap.get(senderRef) || senderRef) : senderRef;
      const isOwn = (typeof senderObj === 'object' ? senderObj?._id : senderObj) === user?._id;
      return { msg: { ...msg, sender: senderObj }, isOwn };
    });
  }, [displayMessages, userMap, user?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [enhancedMessages]);

  const handleSend = () => {
    if (!activeConversationId || !text.trim()) return;

    if (activeConversationId.startsWith('mock-conv-')) {
      const targetUserId = activeConversationId.replace('mock-conv-', '');
      createConversation.mutate(
        { participantId: targetUserId },
        {
          onSuccess: (response: any) => {
            const newConvId = response.data?.data?._id || response.data?._id;
            if (newConvId) {
              setActiveConversation(newConvId);
              sendMessage.mutate({ conversationId: newConvId, content: text });
            }
          },
          onError: (err) => {
            console.error("Failed to create conversation", err);
          }
        }
      );
    } else {
      sendMessage.mutate({ conversationId: activeConversationId, content: text });
    }
    setText('');
  };

  // Resolve current active conversation details
  const chatHeaderDetails = useMemo(() => {
    if (!activeConversationId) return null;

    if (activeConversationId.startsWith('mock-conv-')) {
      const targetUserId = activeConversationId.replace('mock-conv-', '');
      const targetUser = dbUsers.find((u) => u._id === targetUserId);
      if (!targetUser) return null;
      const name = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email || 'Agent';
      const initial = name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
      const isOnline = targetUser.isActive || (targetUser as any).status === 'active' || false;
      return { name, initial, isOnline };
    }

    if (activeConversationId === 'dummy-chat-1') {
      return { name: 'Emily Chen', initial: 'EC', isOnline: true };
    }

    const activeConversation = conversations.find((c) => c._id === activeConversationId);
    if (!activeConversation) return null;

    if (activeConversation.isGroup) {
      const name = activeConversation.name || 'Group Chat';
      const initial = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'G';
      return { name, initial, isOnline: true };
    }

    const otherParticipants = activeConversation.participants.filter((p: any) => p._id !== user?._id);
    const mainParticipant = otherParticipants[0] || activeConversation.participants[0] || user;
    if (otherParticipants.length === 0) return { name: 'Me', initial: 'M', isOnline: true };
    const name = otherParticipants.map((p: any) => getDisplayName(p)).join(', ') || getDisplayName(mainParticipant);
    const initial = name.split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
    const isOnline = mainParticipant?.isActive || (mainParticipant as any)?.status === 'active' || false;
    return { name, initial, isOnline };
  }, [activeConversationId, conversations, dbUsers, user]);

  if (!activeConversationId) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 4,
          bgcolor: 'transparent',
        }}
      >
        <Box sx={{ position: 'relative', mb: 3 }}>

          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
              color: tokens.brand.primary,
              boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 24px rgba(93,26,137,0.08)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93,26,137,0.04)'}`,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <ForumIcon sx={{ fontSize: 36 }} />
          </Avatar>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5, letterSpacing: '-0.02em', zIndex: 1 }}>
          Select a Conversation
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 320, textAlign: 'center', fontWeight: 500, lineHeight: 1.5, zIndex: 1 }}>
          Choose a team member from the sidebar or start a new chat to begin real-time messaging.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: 'transparent', position: 'relative' }}>
      {/* Dynamic Conversational Header Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 1.5, md: 3 },
          py: { xs: 1.5, md: 2 },
          borderBottom: 'none',
          bgcolor: isDarkMode ? 'rgba(20, 18, 25, 0.6)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isDarkMode ? '0 4px 24px rgba(0,0,0,0.2)' : '0 4px 24px rgba(0,0,0,0.02)',
          zIndex: 10,
        }}
      >
        {chatHeaderDetails && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, flex: 1, minWidth: 0, mr: 1 }}>
            <IconButton
              onClick={() => setActiveConversation(null)}
              sx={{ display: { xs: 'flex', md: 'none' }, ml: -1, mr: -0.5, color: 'text.secondary' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: tokens.brand.primary,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {chatHeaderDetails.initial}
              </Avatar>
              {chatHeaderDetails.isOnline && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: tokens.semantic.success,
                    border: `2px solid ${isDarkMode ? '#1e1b24' : '#fff'}`,
                  }}
                />
              )}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                {chatHeaderDetails.name}
              </Typography>
              <Typography variant="caption" noWrap sx={{ display: 'block', color: chatHeaderDetails.isOnline ? tokens.semantic.success : 'text.secondary', fontWeight: 600 }}>
                {chatHeaderDetails.isOnline ? 'Active now' : 'Offline'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Action Header Tools */}
        <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 1.5 }, flexShrink: 0 }}>
          {conversations.find((c) => c._id === activeConversationId)?.isGroup && (
            <Tooltip title="Group Info" arrow>
              <IconButton
                onClick={() => setIsGroupSettingsOpen(true)}
                size="small"
                sx={{
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6', transform: 'scale(1.05)' }
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Search Messages" arrow>
            <IconButton
              onClick={onSearchOpen}
              size="small"
              sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6', transform: 'scale(1.05)' }
              }}
            >
              <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Google Drive Files" arrow>
            <IconButton
              onClick={onDriveOpen}
              size="small"
              sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6', transform: 'scale(1.05)' }
              }}
            >
              <FolderIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        transform: 'translateZ(0)',
        willChange: 'transform',
        p: { xs: 1.5, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(93, 26, 137, 0.15)',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(93, 26, 137, 0.3)',
        },
      }}>
        {showLoader ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={28} sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : (
          <>
            {enhancedMessages.map(({ msg, isOwn }: any) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={isOwn}
                />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </Box>

      {/* Typing Indicator */}
      {otherTypingUsers.length > 0 && (
        <Box sx={{ px: 4, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: tokens.brand.primary, fontStyle: 'italic', fontWeight: 600 }}>
            {otherTypingUsers.length === 1
              ? `${dbUsers.find(u => u._id === otherTypingUsers[0])?.firstName || 'Someone'} is typing...`
              : 'Several people are typing...'}
          </Typography>
        </Box>
      )}

      {/* Floating Capsule Composer Area */}
      <Box sx={{ p: { xs: 1.5, md: 3 }, pt: 1, pb: { xs: 2, md: 3 }, bgcolor: 'transparent', position: 'relative', zIndex: 10 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1,
            px: 2,
            borderRadius: '32px',
            bgcolor: isDarkMode ? 'rgba(20, 18, 25, 0.8)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
            boxShadow: isDarkMode ? '0 12px 32px rgba(0,0,0,0.4)' : '0 12px 32px rgba(93,26,137,0.08)',
            transition: 'all 0.3s ease',
            '&:focus-within': {
              boxShadow: isDarkMode ? '0 16px 48px rgba(0,0,0,0.6)' : '0 16px 48px rgba(93,26,137,0.12)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(93,26,137,0.1)'}`,
            }
          }}
        >
          <Tooltip title="Attach Files" arrow>
            <IconButton
              size="small"
              onClick={(e) => setAttachAnchorEl(e.currentTarget)}
              sx={{
                color: 'text.secondary',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                width: 36,
                height: 36,
                '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }
              }}
              aria-label="Attach file"
            >
              <AttachFileIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* Attach Menu */}
          <Menu
            anchorEl={attachAnchorEl}
            open={isAttachMenuOpen}
            onClose={() => setAttachAnchorEl(null)}
            PaperProps={{
              sx: {
                borderRadius: '16px',
                mt: -2,
                minWidth: 160,
                boxShadow: isDarkMode ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.1)',
                bgcolor: isDarkMode ? '#25212e' : '#fff',
                backgroundImage: 'none',
              }
            }}
            transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
          >
            <MenuItem onClick={() => { setAttachAnchorEl(null); }} sx={{ py: 1.5, px: 2 }}>
              <ListItemIcon>
                <ImageIcon fontSize="small" sx={{ color: tokens.brand.primary }} />
              </ListItemIcon>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Media</Typography>
            </MenuItem>
            <MenuItem onClick={() => { setAttachAnchorEl(null); setDrivePickerOpen(true); }} sx={{ py: 1.5, px: 2 }}>
              <ListItemIcon>
                <AddToDriveIcon fontSize="small" sx={{ color: '#0F9D58' }} />
              </ListItemIcon>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Drive</Typography>
            </MenuItem>
          </Menu>

          <TextField
            fullWidth
            multiline
            maxRows={5}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              const now = Date.now();
              if (activeConversationId && !activeConversationId.startsWith('mock-') && now - lastTypingEmit.current > 1500) {
                emitTyping(activeConversationId);
                lastTypingEmit.current = now;
              }
            }}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            variant="standard"
            InputProps={{
              disableUnderline: true,
            }}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.95rem',
                color: 'text.primary',
                py: 1,
              },
            }}
            aria-label="Message input"
          />

          <IconButton
            onClick={handleSend}
            disabled={sendMessage.isPending || !text.trim()}
            sx={{
              width: 44,
              height: 44,
              bgcolor: tokens.brand.primary,
              color: '#fff',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(93, 26, 137, 0.3)',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                transform: 'scale(1.08)',
                boxShadow: '0 6px 16px rgba(93, 26, 137, 0.4)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&.Mui-disabled': {
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                color: 'text.disabled',
                boxShadow: 'none',
              },
            }}
            aria-label="Send message"
          >
            {sendMessage.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendIcon sx={{ fontSize: 18, ml: 0.5 }} />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* Google Drive File Picker */}
      <DriveFilePicker open={drivePickerOpen} onClose={() => setDrivePickerOpen(false)} />

      {/* Group Settings Modal */}
      {conversations.find((c) => c._id === activeConversationId) && (
        <GroupSettingsModal
          open={isGroupSettingsOpen}
          onClose={() => setIsGroupSettingsOpen(false)}
          conversation={conversations.find((c) => c._id === activeConversationId)!}
        />
      )}
    </Box>
  );
};
