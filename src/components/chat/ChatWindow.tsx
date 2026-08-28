import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import ReplyIcon from '@mui/icons-material/Reply';
import { useMessages, useSendMessage, useSendChatImage, useConversations, useCreateConversation, useMarkConversationRead } from '@/hooks/api/useChat';
import { useUsers } from '@/hooks/api/useUsers';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { GroupSettingsModal } from './GroupSettingsModal';
import { DriveFilePicker } from './DriveFilePicker';
import { tokens } from '@/styles/tokens';
import { PRESENCE_COLORS } from '@/lib/constants';
import { getDisplayName, getPresenceLabel } from '@/utils/formatters';
import {
  formatChatDayLabel,
  getReplyPreviewText,
  isSameMessageDay,
} from '@/utils/chatMessageUtils';
import type { Message, PresenceStatus } from '@/types';

interface ChatWindowProps {
  onSearchOpen?: () => void;
  onDriveOpen?: () => void;
}

export const ChatWindow = ({ onSearchOpen, onDriveOpen }: ChatWindowProps) => {
  const { activeConversationId, setActiveConversation, clearUnread, setReplyingTo } = useChatStore();
  const replyingTo = useChatStore((s) => s.replyingTo);
  const presenceByUserId = useChatStore((s) => s.presenceByUserId);
  const { user } = useAuth();
  const { data: conversations = [] } = useConversations();
  const { data: dbUsers = [] } = useUsers();
  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(activeConversationId);
  const sendMessage = useSendMessage();
  const sendChatImage = useSendChatImage();
  const createConversation = useCreateConversation();
  const markRead = useMarkConversationRead();
  const [text, setText] = useState('');
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const isPrependingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const { joinChat, leaveChat, emitTyping, subscribePresence } = useSocket();
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
    if (!activeConversationId || activeConversationId.startsWith('mock-')) return;

    joinChat(activeConversationId);
    clearUnread(activeConversationId);
    markRead.mutate(activeConversationId);

    return () => leaveChat(activeConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when conversation changes
  }, [activeConversationId, joinChat, leaveChat, clearUnread]);

  const otherParticipantIds = useMemo(() => {
    if (!activeConversationId || !user?._id) return [] as string[];
    if (activeConversationId.startsWith('mock-conv-')) {
      return [activeConversationId.replace('mock-conv-', '')];
    }
    const activeConversation = conversations.find((c) => c._id === activeConversationId);
    if (!activeConversation) return [];
    return activeConversation.participants
      .map((p: any) => (typeof p === 'string' ? p : p._id))
      .filter((id: string) => id && id !== user._id);
  }, [activeConversationId, conversations, user?._id]);

  const isGroupConversation = useMemo(() => {
    if (!activeConversationId) return false;
    const activeConversation = conversations.find((c) => c._id === activeConversationId);
    return Boolean(activeConversation?.isGroup);
  }, [activeConversationId, conversations]);

  const otherParticipants = useMemo(() => {
    return otherParticipantIds.map((id) => {
      const fromConv = conversations
        .find((c) => c._id === activeConversationId)
        ?.participants.find((p: any) => (typeof p === 'string' ? p : p._id) === id);
      const userObj =
        (typeof fromConv === 'object' && fromConv) || dbUsers.find((u) => u._id === id);
      return {
        id,
        name: getDisplayName(typeof userObj === 'object' ? userObj : undefined),
      };
    });
  }, [otherParticipantIds, conversations, activeConversationId, dbUsers]);

  useEffect(() => {
    if (!otherParticipantIds.length) return;
    subscribePresence(otherParticipantIds);
  }, [otherParticipantIds, subscribePresence]);

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
  }, [setReplyingTo]);

  const handleQuoteClick = useCallback((messageId: string) => {
    const el = messagesContainerRef.current?.querySelector(`[data-message-id="${messageId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const clearPendingImage = useCallback(() => {
    setPendingImage(null);
    setPendingPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  }, []);

  const stageImageFile = useCallback((file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPendingImage(file);
    setPendingPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  // Mark as read when new messages arrive while this conversation is open
  const lastMarkedMessageId = useRef<string | null>(null);
  useEffect(() => {
    if (!activeConversationId || activeConversationId.startsWith('mock-') || messages.length === 0) return;
    const last = messages[messages.length - 1] as any;
    if (!last?._id || last._id === lastMarkedMessageId.current) return;
    lastMarkedMessageId.current = last._id;
    const senderRef = last.senderId || last.sender;
    const senderId = typeof senderRef === 'object' ? senderRef?._id : senderRef;
    if (senderId !== user?._id) {
      clearUnread(activeConversationId);
      markRead.mutate(activeConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeConversationId, user?._id, clearUnread]);

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

      let replyTo = msg.replyTo;
      if (replyTo && typeof replyTo === 'object') {
        const replySenderRef = replyTo.sender || replyTo.senderId;
        const replySenderObj =
          typeof replySenderRef === 'string'
            ? userMap.get(replySenderRef) || replySenderRef
            : replySenderRef;
        replyTo = { ...replyTo, sender: replySenderObj, senderId: replySenderObj };
      }

      return { msg: { ...msg, sender: senderObj, replyTo }, isOwn };
    });
  }, [displayMessages, userMap, user?._id]);

  useEffect(() => {
    shouldStickToBottomRef.current = true;
    isPrependingRef.current = false;
  }, [activeConversationId]);

  const loadOlderMessages = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = messagesContainerRef.current;
    if (el) {
      prevScrollHeightRef.current = el.scrollHeight;
      isPrependingRef.current = true;
    }
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 96;
    if (el.scrollTop < 72) {
      loadOlderMessages();
    }
  }, [loadOlderMessages]);

  useLayoutEffect(() => {
    const el = messagesContainerRef.current;
    if (isPrependingRef.current && el) {
      const diff = el.scrollHeight - prevScrollHeightRef.current;
      if (diff) el.scrollTop += diff;
      prevScrollHeightRef.current = el.scrollHeight;
      if (!isFetchingNextPage) isPrependingRef.current = false;
      return;
    }
    if (shouldStickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [enhancedMessages, isFetchingNextPage]);

  const handleSend = () => {
    if (!activeConversationId) return;
    shouldStickToBottomRef.current = true;
    const replyToId = replyingTo?._id;
    const caption = text.trim();

    const sendImage = (conversationId: string) => {
      if (!pendingImage) return;
      sendChatImage.mutate(
        {
          conversationId,
          file: pendingImage,
          content: caption || undefined,
          replyTo: replyToId,
        },
        {
          onSuccess: () => {
            setText('');
            setReplyingTo(null);
            clearPendingImage();
          },
        },
      );
    };

    if (pendingImage) {
      if (activeConversationId.startsWith('mock-conv-')) {
        const targetUserId = activeConversationId.replace('mock-conv-', '');
        createConversation.mutate(
          { participantId: targetUserId },
          {
            onSuccess: (response: any) => {
              const newConvId = response.data?.data?._id || response.data?._id;
              if (newConvId) {
                setActiveConversation(newConvId);
                sendImage(newConvId);
              }
            },
          },
        );
        return;
      }
      sendImage(activeConversationId);
      return;
    }

    if (!caption) return;
    const payload = {
      content: text,
      ...(replyToId ? { replyTo: replyToId } : {}),
    };

    if (activeConversationId.startsWith('mock-conv-')) {
      const targetUserId = activeConversationId.replace('mock-conv-', '');
      createConversation.mutate(
        { participantId: targetUserId },
        {
          onSuccess: (response: any) => {
            const newConvId = response.data?.data?._id || response.data?._id;
            if (newConvId) {
              setActiveConversation(newConvId);
              sendMessage.mutate({ conversationId: newConvId, ...payload });
            }
          },
          onError: (err) => {
            console.error("Failed to create conversation", err);
          }
        }
      );
    } else {
      sendMessage.mutate({ conversationId: activeConversationId, ...payload });
    }
    setText('');
    setReplyingTo(null);
  };

  // Resolve current active conversation details
  const chatHeaderDetails = useMemo(() => {
    if (!activeConversationId) return null;

    const resolvePresence = (userId?: string, fallbackUser?: any) => {
      const fromStore = userId ? presenceByUserId[userId] : undefined;
      const status: PresenceStatus =
        fromStore?.status ||
        fallbackUser?.presenceStatus ||
        (fallbackUser?.isOnline ? 'online' : 'offline');
      const lastSeenAt = fromStore?.lastSeenAt || fallbackUser?.lastSeenAt;
      return { status, lastSeenAt, presenceLabel: getPresenceLabel(status, lastSeenAt) };
    };

    if (activeConversationId.startsWith('mock-conv-')) {
      const targetUserId = activeConversationId.replace('mock-conv-', '');
      const targetUser = dbUsers.find((u) => u._id === targetUserId);
      if (!targetUser) return null;
      const name = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email || 'Agent';
      const initial = name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
      const presence = resolvePresence(targetUserId, targetUser);
      return { name, initial, isGroup: false, ...presence };
    }

    if (activeConversationId === 'dummy-chat-1') {
      return { name: 'Emily Chen', initial: 'EC', isGroup: false, status: 'online' as PresenceStatus, lastSeenAt: undefined, presenceLabel: 'Active now' };
    }

    const activeConversation = conversations.find((c) => c._id === activeConversationId);
    if (!activeConversation) return null;

    if (activeConversation.isGroup) {
      const name = activeConversation.name || 'Group Chat';
      const initial = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'G';
      const onlineCount = otherParticipantIds.filter((id) => {
        const p = presenceByUserId[id];
        return (p?.status || 'offline') === 'online';
      }).length;
      return {
        name,
        initial,
        isGroup: true,
        status: (onlineCount > 0 ? 'online' : 'offline') as PresenceStatus,
        lastSeenAt: undefined,
        presenceLabel: `${activeConversation.participants.length} members${onlineCount ? ` · ${onlineCount} online` : ''}`,
      };
    }

    const otherParticipants = activeConversation.participants.filter((p: any) => p._id !== user?._id);
    const mainParticipant = otherParticipants[0] || activeConversation.participants[0] || user;
    if (otherParticipants.length === 0) {
      return { name: 'Me', initial: 'M', isGroup: false, status: 'online' as PresenceStatus, lastSeenAt: undefined, presenceLabel: 'Active now' };
    }
    const name = otherParticipants.map((p: any) => getDisplayName(p)).join(', ') || getDisplayName(mainParticipant);
    const initial = name.split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
    const mainId = typeof mainParticipant === 'object' ? mainParticipant?._id : mainParticipant;
    const presence = resolvePresence(mainId, mainParticipant);
    return { name, initial, isGroup: false, ...presence };
  }, [activeConversationId, conversations, dbUsers, user, presenceByUserId, otherParticipantIds]);

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
    <Box
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: 'transparent', position: 'relative' }}
      onDragOver={(e) => {
        if ([...e.dataTransfer.types].includes('Files')) {
          e.preventDefault();
          setIsDraggingImage(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingImage(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingImage(false);
        const file = e.dataTransfer.files?.[0];
        stageImageFile(file);
      }}
    >
      {isDraggingImage && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isDarkMode ? 'rgba(20,18,25,0.72)' : 'rgba(255,255,255,0.72)',
            border: `2px dashed ${tokens.brand.primary}`,
            pointerEvents: 'none',
          }}
        >
          <Typography sx={{ fontWeight: 800, color: tokens.brand.primary }}>Drop image to send</Typography>
        </Box>
      )}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        hidden
        onChange={(e) => {
          stageImageFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
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
          /* backdropFilter: 'blur(20px)' (removed for performance) */
          /* WebkitBackdropFilter: 'blur(20px)' (removed for performance) */
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
              {!chatHeaderDetails.isGroup && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: PRESENCE_COLORS[chatHeaderDetails.status] || PRESENCE_COLORS.offline,
                    border: `2px solid ${isDarkMode ? '#1e1b24' : '#fff'}`,
                  }}
                />
              )}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                {chatHeaderDetails.name}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  display: 'block',
                  color:
                    chatHeaderDetails.status === 'online'
                      ? PRESENCE_COLORS.online
                      : chatHeaderDetails.status === 'away'
                        ? PRESENCE_COLORS.away
                        : 'text.secondary',
                  fontWeight: 600,
                }}
              >
                {chatHeaderDetails.presenceLabel}
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

      <Box
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        sx={{
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
            {(isFetchingNextPage || hasNextPage) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1, minHeight: 28 }}>
                {isFetchingNextPage ? (
                  <CircularProgress size={20} sx={{ color: tokens.brand.primary }} />
                ) : null}
              </Box>
            )}
            {enhancedMessages.map(({ msg, isOwn }: any, index: number) => {
              const prevMsg = index > 0 ? enhancedMessages[index - 1]?.msg : null;
              const showDaySeparator =
                Boolean(msg.createdAt) &&
                (!prevMsg || !isSameMessageDay(prevMsg.createdAt, msg.createdAt));

              return (
                <Box key={msg._id} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {showDaySeparator && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        my: index === 0 ? 0.5 : 1,
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                      }}
                    >
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          px: 1.75,
                          py: 0.5,
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          letterSpacing: '0.02em',
                          color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                          bgcolor: isDarkMode ? 'rgba(20, 18, 25, 0.85)' : 'rgba(255,255,255,0.92)',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93,26,137,0.08)'}`,
                          boxShadow: isDarkMode
                            ? '0 2px 8px rgba(0,0,0,0.25)'
                            : '0 2px 8px rgba(93,26,137,0.06)',
                        }}
                      >
                        {formatChatDayLabel(msg.createdAt)}
                      </Typography>
                    </Box>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    currentUserId={user?._id}
                    otherParticipantIds={otherParticipantIds}
                    otherParticipants={otherParticipants}
                    isGroup={isGroupConversation}
                    onReply={handleReply}
                    onQuoteClick={handleQuoteClick}
                  />
                </Box>
              );
            })}
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
        {replyingTo && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              mb: 1,
              mx: 0.5,
              px: 2,
              py: 1.25,
              borderRadius: '18px',
              bgcolor: isDarkMode ? 'rgba(20, 18, 25, 0.75)' : 'rgba(255,255,255,0.9)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(93,26,137,0.08)'}`,
              borderLeft: `3px solid ${tokens.brand.primary}`,
            }}
          >
            <ReplyIcon sx={{ fontSize: 18, color: tokens.brand.primary }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, display: 'block' }}>
                Replying to{' '}
                {getDisplayName(
                  typeof replyingTo.sender === 'object' ? replyingTo.sender : undefined,
                )}
              </Typography>
              <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 500 }}>
                {getReplyPreviewText(replyingTo)}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        )}
        {pendingImage && pendingPreviewUrl && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 1,
              mx: 0.5,
              px: 1.5,
              py: 1,
              borderRadius: '18px',
              bgcolor: isDarkMode ? 'rgba(20, 18, 25, 0.75)' : 'rgba(255,255,255,0.9)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(93,26,137,0.08)'}`,
            }}
          >
            <Box
              component="img"
              src={pendingPreviewUrl}
              alt="Pending upload"
              sx={{ width: 56, height: 56, borderRadius: '10px', objectFit: 'cover' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                {pendingImage.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Add an optional caption below, then send
              </Typography>
            </Box>
            <IconButton size="small" onClick={clearPendingImage} aria-label="Remove image">
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1,
            px: 2,
            borderRadius: '32px',
            bgcolor: isDarkMode ? 'rgba(20, 18, 25, 0.8)' : 'rgba(255, 255, 255, 0.85)',
            /* backdropFilter: 'blur(24px)' (removed for performance) */
            /* WebkitBackdropFilter: 'blur(24px)' (removed for performance) */
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

            <MenuItem onClick={() => { setAttachAnchorEl(null); imageInputRef.current?.click(); }} sx={{ py: 1.5, px: 2 }}>
              <ListItemIcon>
                <ImageOutlinedIcon fontSize="small" sx={{ color: tokens.brand.primary }} />
              </ListItemIcon>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Upload image</Typography>
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
            placeholder={pendingImage ? 'Add a caption (optional)...' : 'Type a message...'}
            onPaste={(e) => {
              const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
              if (!item) return;
              const file = item.getAsFile();
              if (file) {
                e.preventDefault();
                stageImageFile(file);
              }
            }}
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
            disabled={sendMessage.isPending || sendChatImage.isPending || (!text.trim() && !pendingImage)}
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
            {sendMessage.isPending || sendChatImage.isPending ? (
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
