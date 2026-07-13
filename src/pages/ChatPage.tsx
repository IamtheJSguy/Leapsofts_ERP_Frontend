import { useState } from 'react';
import { Box, Card, useTheme } from '@mui/material';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatSearchModal } from '@/components/chat/ChatSearchModal';
import { DriveFilePicker } from '@/components/chat/DriveFilePicker';
import { useChatStore } from '@/store/useChatStore';

const ChatPage = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const activeConversationId = useChatStore((s) => s.activeConversationId);

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
