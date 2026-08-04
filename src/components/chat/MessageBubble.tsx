import React from 'react';
import { Box, Typography, Paper, Avatar, useTheme, IconButton, Tooltip } from '@mui/material';
import type { Message } from '@/types';
import { getDisplayName } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';
import { MESSAGE_SEEN_TICK_COLOR } from '@/lib/constants';
import {
  getReplyPreviewText,
  getTickStatus,
  resolveReplySnippet,
  type TickStatus,
} from '@/utils/chatMessageUtils';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ReplyIcon from '@mui/icons-material/Reply';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

/**
 * Map Drive MIME types to icon + color for in-chat rendering.
 */
const getDriveFileIcon = (mimeType?: string): { icon: React.ReactNode; color: string; bgColor: string } => {
  if (!mimeType) return { icon: <InsertDriveFileIcon />, color: '#607D8B', bgColor: 'rgba(96, 125, 139, 0.1)' };
  if (mimeType.includes('document') || mimeType.includes('msword') || mimeType === 'application/vnd.google-apps.document')
    return { icon: <DescriptionIcon />, color: '#4285F4', bgColor: 'rgba(66, 133, 244, 0.1)' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'application/vnd.google-apps.spreadsheet')
    return { icon: <TableChartIcon />, color: '#0F9D58', bgColor: 'rgba(15, 157, 88, 0.1)' };
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || mimeType === 'application/vnd.google-apps.presentation')
    return { icon: <SlideshowIcon />, color: '#F4B400', bgColor: 'rgba(244, 180, 0, 0.1)' };
  if (mimeType === 'application/pdf')
    return { icon: <PictureAsPdfIcon />, color: '#EA4335', bgColor: 'rgba(234, 67, 53, 0.1)' };
  if (mimeType.startsWith('image/'))
    return { icon: <ImageIcon />, color: '#E91E63', bgColor: 'rgba(233, 30, 99, 0.1)' };
  return { icon: <InsertDriveFileIcon />, color: '#607D8B', bgColor: 'rgba(96, 125, 139, 0.1)' };
};

const TickIcon = ({ status, isOwn }: { status: TickStatus; isOwn: boolean }) => {
  const baseColor = isOwn ? 'rgba(255,255,255,0.85)' : 'text.secondary';
  if (status === 'sent') {
    return <DoneIcon sx={{ fontSize: 14, color: baseColor }} />;
  }
  return (
    <DoneAllIcon
      sx={{
        fontSize: 14,
        color: status === 'seen' ? MESSAGE_SEEN_TICK_COLOR : baseColor,
      }}
    />
  );
};

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  otherParticipantIds?: string[];
  onReply?: (message: Message) => void;
  onQuoteClick?: (messageId: string) => void;
}

export const MessageBubble = React.memo(({
  message,
  isOwn,
  otherParticipantIds = [],
  onReply,
  onQuoteClick,
}: MessageBubbleProps) => {
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
  const isDriveFile = message.type === 'drive_file';
  const tickStatus = isOwn ? getTickStatus(message, otherParticipantIds) : 'sent';
  const replySnippet = resolveReplySnippet(message.replyTo);
  const replySender = replySnippet
    ? getDisplayName(
        typeof replySnippet.sender === 'object'
          ? replySnippet.sender
          : typeof replySnippet.senderId === 'object'
            ? replySnippet.senderId
            : undefined,
      )
    : '';

  return (
    <Box
      data-message-id={message._id}
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        mb: 2,
        gap: 1.25,
        '&:hover .reply-action': { opacity: 1 },
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '70%', position: 'relative' }}>
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
          {/* Message bubble card */}
          <Paper
            elevation={0}
            sx={{
              p: isDriveFile ? '0' : '12px 18px',
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
              boxShadow: 'none',
              overflow: 'hidden',
              minWidth: replySnippet ? 180 : undefined,
            }}
          >
            {replySnippet && (
              <Box
                onClick={() => onQuoteClick?.(replySnippet._id)}
                sx={{
                  mb: isDriveFile ? 0 : 1,
                  mx: isDriveFile ? 1.5 : 0,
                  mt: isDriveFile ? 1.25 : 0,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: '10px',
                  borderLeft: `3px solid ${isOwn ? 'rgba(255,255,255,0.85)' : tokens.brand.primary}`,
                  bgcolor: isOwn ? 'rgba(255,255,255,0.12)' : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(93, 26, 137, 0.06)'),
                  cursor: onQuoteClick ? 'pointer' : 'default',
                  '&:hover': onQuoteClick
                    ? { bgcolor: isOwn ? 'rgba(255,255,255,0.18)' : (isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(93, 26, 137, 0.1)') }
                    : undefined,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    color: isOwn ? 'rgba(255,255,255,0.95)' : tokens.brand.primary,
                    mb: 0.15,
                  }}
                  noWrap
                >
                  {replySender || 'Message'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: isOwn ? 'rgba(255,255,255,0.75)' : 'text.secondary',
                  }}
                  noWrap
                >
                  {getReplyPreviewText(replySnippet)}
                </Typography>
              </Box>
            )}

            {isDriveFile ? (
              /* ───── Drive File Card ───── */
              <Box
                component="a"
                href={message.driveWebViewLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: '14px 18px',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isOwn ? 'rgba(255,255,255,0.08)' : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)'),
                  },
                }}
              >
                {(() => {
                  const { icon, color, bgColor } = getDriveFileIcon(message.driveMimeType);
                  return (
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        bgcolor: isOwn ? 'rgba(255,255,255,0.15)' : bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: isOwn ? '#fff' : color,
                        '& svg': { fontSize: 22 },
                      }}
                    >
                      {icon}
                    </Box>
                  );
                })()}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: isOwn ? '#fff' : 'text.primary',
                    }}
                  >
                    {message.driveFileName || message.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    Google Drive
                    <OpenInNewIcon sx={{ fontSize: 11 }} />
                  </Typography>
                </Box>
              </Box>
            ) : (
              /* ───── Regular Text Message ───── */
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
            )}

            {/* Time & status checkmark inside the bubble */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 0.5,
                mt: isDriveFile ? 0 : 0.5,
                px: isDriveFile ? 2 : 0,
                pb: isDriveFile ? 1 : 0,
                opacity: 0.85,
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
              {isOwn && <TickIcon status={tickStatus} isOwn={isOwn} />}
            </Box>
          </Paper>

          {onReply && (
            <Tooltip title="Reply" arrow>
              <IconButton
                className="reply-action"
                size="small"
                onClick={() => onReply(message)}
                sx={{
                  opacity: { xs: 1, md: 0 },
                  transition: 'opacity 0.15s ease',
                  color: 'text.secondary',
                  width: 28,
                  height: 28,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    color: tokens.brand.primary,
                  },
                }}
                aria-label="Reply to message"
              >
                <ReplyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
});
