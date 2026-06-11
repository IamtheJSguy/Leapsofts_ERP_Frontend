import { useEffect, useRef, useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Avatar,
  Typography,
  CircularProgress,
  useTheme,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import ForumIcon from '@mui/icons-material/Forum';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useMessages, useSendMessage, useConversations, useCreateConversation } from '@/hooks/api/useChat';
import { useUsers } from '@/hooks/api/useUsers';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { tokens } from '@/styles/tokens';
import { getDisplayName } from '@/utils/formatters';
import { useMemo } from 'react';

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
  const { joinRoom, leaveRoom } = useSocket();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    if (activeConversationId) {
      const room = `conversation:${activeConversationId}`;
      joinRoom(room);
      return () => leaveRoom(room);
    }
  }, [activeConversationId, joinRoom, leaveRoom]);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const handleSend = () => {
    if (!activeConversationId || !text.trim()) return;

    if (activeConversationId.startsWith('mock-conv-')) {
      const targetUserId = activeConversationId.replace('mock-conv-', '');
      createConversation.mutate(
        { participantIds: [targetUserId] },
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

    const activeConversation = conversations.find((c) => c._id === activeConversationId);
    if (!activeConversation) return null;

    const otherParticipants = activeConversation.participants.filter((p) => p._id !== user?._id);
    const mainParticipant = otherParticipants[0] || activeConversation.participants[0] || user;
    const name = otherParticipants.map((p) => getDisplayName(p)).join(', ') || getDisplayName(mainParticipant);
    const initial = name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
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
          bgcolor: isDarkMode ? 'transparent' : 'rgba(0,0,0,0.002)',
        }}
      >
        <Avatar
          sx={{
            width: 70,
            height: 70,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(93, 26, 137, 0.04)',
            color: tokens.brand.primary,
            mb: 2.5,
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(93, 26, 137, 0.08)'}`,
          }}
        >
          <ForumIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, letterSpacing: '-0.01em' }}>
          Select a Conversation
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 280, textAlign: 'center', fontWeight: 500 }}>
          Choose a team member from the conversations list to begin real-time messaging.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: isDarkMode ? 'rgba(20, 18, 25, 0.1)' : '#fff' }}>
      {/* Dynamic Conversational Header Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
          bgcolor: isDarkMode ? 'rgba(24, 20, 31, 0.25)' : 'rgba(0,0,0,0.002)',
        }}
      >
        {chatHeaderDetails && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative' }}>
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
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                {chatHeaderDetails.name}
              </Typography>
              <Typography variant="caption" sx={{ color: chatHeaderDetails.isOnline ? tokens.semantic.success : 'text.secondary', fontWeight: 600 }}>
                {chatHeaderDetails.isOnline ? 'Active now' : 'Offline'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Action Header Tools */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Search Messages" arrow>
            <IconButton onClick={onSearchOpen} size="small" sx={{ border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }} aria-label="Search messages">
              <SearchIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Google Drive Files" arrow>
            <IconButton onClick={onDriveOpen} size="small" sx={{ border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }} aria-label="Google Drive">
              <FolderIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Messages Stream Scrollbox */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {showLoader ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={28} sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : (
          <>
            {displayMessages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwn={(typeof msg.sender === 'object' ? msg.sender?._id : msg.sender) === user?._id}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </Box>

      {/* Floating Capsule Composer Area */}
      <Box sx={{ p: 2.5, borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1,
            px: 2,
            borderRadius: '28px',
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.015)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDarkMode ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <Tooltip title="Attach Files" arrow>
            <IconButton size="small" sx={{ color: 'text.secondary' }} aria-label="Attach file">
              <AttachFileIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message here..."
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
                fontSize: '0.86rem',
                color: 'text.primary',
                py: 0.5,
              },
            }}
            aria-label="Message input"
          />

          <IconButton
            onClick={handleSend}
            disabled={sendMessage.isPending || !text.trim()}
            sx={{
              width: 36,
              height: 36,
              bgcolor: tokens.brand.primary,
              color: '#fff',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                transform: 'scale(1.06)',
              },
              '&.Mui-disabled': {
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                color: 'text.disabled',
              },
            }}
            aria-label="Send message"
          >
            {sendMessage.isPending ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SendIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};
