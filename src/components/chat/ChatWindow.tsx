import { useEffect, useRef, useState } from 'react';
import { Box, TextField, IconButton, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useMessages, useSendMessage } from '@/hooks/api/useChat';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from '@/components/common/EmptyState';

export const ChatWindow = () => {
  const { activeConversationId } = useChatStore();
  const { user } = useAuth();
  const { data: messages = [] } = useMessages(activeConversationId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { joinRoom, leaveRoom } = useSocket();

  useEffect(() => {
    if (activeConversationId) {
      const room = `conversation:${activeConversationId}`;
      joinRoom(room);
      return () => leaveRoom(room);
    }
  }, [activeConversationId, joinRoom, leaveRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!activeConversationId || !text.trim()) return;
    sendMessage.mutate({ conversationId: activeConversationId, content: text });
    setText('');
  };

  if (!activeConversationId) {
    return <EmptyState title="Select a conversation" description="Choose a chat from the sidebar." />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper sx={{ flex: 1, overflow: 'auto', p: 2, mb: 1 }}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={
              (typeof msg.sender === 'object' ? msg.sender._id : msg.sender) === user?._id
            }
          />
        ))}
        <div ref={bottomRef} />
      </Paper>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton aria-label="Attach file">
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          size="small"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          aria-label="Message input"
        />
        <IconButton onClick={handleSend} disabled={sendMessage.isPending} aria-label="Send message">
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
