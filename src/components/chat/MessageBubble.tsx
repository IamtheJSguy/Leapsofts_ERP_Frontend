import { Box, Typography, Paper, Avatar, useTheme } from '@mui/material';
import type { Message } from '@/types';
import { getDisplayName } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';
import DoneAllIcon from '@mui/icons-material/DoneAll';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Resolve participant initial and details
  const senderName = getDisplayName(typeof message.sender === 'object' ? message.sender : undefined);
  const senderInitial = senderName.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  // Format message time cleanly (e.g. 10:45 AM)
  const formatTimeOnly = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const messageTime = message.createdAt ? formatTimeOnly(message.createdAt) : '';

  return (
    <Box
      className="animate-fade-in-up"
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        mb: 2,
        gap: 1.25,
      }}
    >
      {/* Received message avatar */}
      {!isOwn && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(93, 26, 137, 0.05)',
            color: tokens.brand.primary,
            fontSize: '0.74rem',
            fontWeight: 800,
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
            mb: 0.25,
          }}
        >
          {senderInitial}
        </Avatar>
      )}

      {/* Bubble Container */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
        {/* Name (for group messaging look) */}
        {!isOwn && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              ml: 1,
              mb: 0.5,
              fontSize: '0.68rem',
              letterSpacing: '0.01em',
            }}
          >
            {senderName}
          </Typography>
        )}

        {/* Message bubble card */}
        <Paper
          elevation={0}
          sx={{
            p: '12px 18px',
            borderRadius: '24px',
            borderBottomRightRadius: isOwn ? '4px' : '24px',
            borderBottomLeftRadius: isOwn ? '24px' : '4px',
            background: isOwn 
              ? `linear-gradient(135deg, ${tokens.brand.primary}, #8A2BE2)` 
              : (isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff'),
            color: isOwn ? '#fff' : 'text.primary',
            border: isOwn 
              ? 'none' 
              : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
            boxShadow: isOwn 
              ? '0 8px 24px rgba(93,26,137,0.25)' 
              : (isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.02)'),
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.85rem',
              fontWeight: 500,
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </Typography>

          {/* Time & status checkmark inside the bubble */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.5,
              opacity: 0.65,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.62rem',
                fontWeight: 600,
                color: isOwn ? 'rgba(255,255,255,0.8)' : 'text.secondary',
              }}
            >
              {messageTime}
            </Typography>
            {isOwn && (
              <DoneAllIcon
                sx={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.9)',
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
