import { useState } from 'react';
import { Typography, Box, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatSearchModal } from '@/components/chat/ChatSearchModal';
import { DriveFilePicker } from '@/components/chat/DriveFilePicker';

const ChatPage = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Chat</Typography>
        <Box>
          <IconButton onClick={() => setSearchOpen(true)} aria-label="Search messages">
            <SearchIcon />
          </IconButton>
          <IconButton onClick={() => setDriveOpen(true)} aria-label="Google Drive">
            <FolderIcon />
          </IconButton>
        </Box>
      </Box>
      <Box className="chat-layout">
        <ChatSidebar />
        <ChatWindow />
      </Box>
      <ChatSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <DriveFilePicker open={driveOpen} onClose={() => setDriveOpen(false)} />
    </>
  );
};

export default ChatPage;
