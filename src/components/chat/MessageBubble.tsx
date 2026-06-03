import { Box, Typography, Paper } from '@mui/material';
import type { Message } from '@/types';
import { getDisplayName, formatDateTime } from '@/utils/formatters';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => (
  <Box sx={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', mb: 1 }}>
    <Paper
      sx={{
        p: 1.5,
        maxWidth: '70%',
        bgcolor: isOwn ? 'primary.main' : 'grey.100',
        color: isOwn ? 'primary.contrastText' : 'text.primary',
      }}
    >
      {!isOwn && (
        <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
          {getDisplayName(typeof message.sender === 'object' ? message.sender : undefined)}
        </Typography>
      )}
      <Typography variant="body2">{message.content}</Typography>
      <Typography variant="caption" display="block" sx={{ opacity: 0.7, mt: 0.5 }}>
        {formatDateTime(message.createdAt)}
      </Typography>
    </Paper>
  </Box>
);
