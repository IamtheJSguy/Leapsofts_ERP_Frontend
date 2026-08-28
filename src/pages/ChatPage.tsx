import { useState, useEffect } from 'react';
import { Box, Card, useTheme } from '@mui/material';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatSearchModal } from '@/components/chat/ChatSearchModal';
import { DriveFilePicker } from '@/components/chat/DriveFilePicker';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '@/store/useChatStore';
import { useConversations } from '@/hooks/api/useChat';
import { closeRemovedConversation } from '@/utils/closeRemovedConversation';

const ChatPage = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { activeConversationId, setActiveConversation } = useChatStore();
  const { data: conversations, isSuccess: conversationsLoaded } = useConversations();

  useEffect(() => {
    if (conversationId) {
      const isMock = conversationId.startsWith('mock-');
      const stillMember =
        isMock || conversations?.some((c) => c._id === conversationId);
      if (conversationsLoaded && !stillMember) {
        closeRemovedConversation(conversationId);
        return;
      }
      if (conversationId !== activeConversationId) {
        setActiveConversation(conversationId);
      }
      return;
    }
    if (activeConversationId) {
      navigate(`/chat/${activeConversationId}`, { replace: true });
    }
  }, [
    conversationId,
    activeConversationId,
    conversations,
    conversationsLoaded,
    setActiveConversation,
    navigate,
  ]);

  useEffect(() => {
    return () => {
      setActiveConversation(null);
    };
  }, [setActiveConversation]);

  return (
    <Box
      className="animate-fade-in-up"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        minHeight: 0,
      }}
    >

      {/* Unified Chat Box Wrapper */}
      <Card
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '340px 1fr' },
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.6)',
          /* backdropFilter: 'blur(24px)' (removed for performance) */
          /* WebkitBackdropFilter: 'blur(24px)' (removed for performance) */
          border: 'none',
          boxShadow: isDarkMode ? '0 12px 48px rgba(0,0,0,0.4)' : '0 12px 48px rgba(93,26,137,0.06)',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <Box sx={{ display: { xs: activeConversationId ? 'none' : 'flex', md: 'flex' }, flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          <ChatSidebar />
        </Box>
        <Box sx={{ display: { xs: activeConversationId ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          <ChatWindow onSearchOpen={() => setSearchOpen(true)} onDriveOpen={() => setDriveOpen(true)} />
        </Box>
      </Card>

      <ChatSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <DriveFilePicker open={driveOpen} onClose={() => setDriveOpen(false)} />
    </Box>
  );
};

export default ChatPage;
