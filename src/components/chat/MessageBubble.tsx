import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  useTheme,
  IconButton,
  Tooltip,
  Popover,
  ClickAwayListener,
} from '@mui/material';
import type { Message, MessageReaction } from '@/types';
import { getDisplayName } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';
import { MESSAGE_SEEN_TICK_COLOR, QUICK_REACTION_EMOJIS } from '@/lib/constants';
import {
  getReplyPreviewText,
  getTickStatus,
  resolveReplySnippet,
  type TickStatus,
} from '@/utils/chatMessageUtils';
import { useSetMessageReaction } from '@/hooks/api/useChat';
import {
  MessageInfoDialog,
  type MessageInfoParticipant,
} from './MessageInfoDialog';
import { MessageReactionsDialog } from './MessageReactionsDialog';
import { LinkifiedText } from './LinkifiedText';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ReplyIcon from '@mui/icons-material/Reply';
import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EmojiPicker, { Theme as EmojiTheme, type EmojiClickData } from 'emoji-picker-react';

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

const getReactionUserId = (reaction: MessageReaction): string =>
  typeof reaction.userId === 'string' ? reaction.userId : reaction.userId._id;

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId?: string;
  otherParticipantIds?: string[];
  otherParticipants?: MessageInfoParticipant[];
  isGroup?: boolean;
  onReply?: (message: Message) => void;
  onQuoteClick?: (messageId: string) => void;
}

export const MessageBubble = React.memo(({
  message,
  isOwn,
  currentUserId,
  otherParticipantIds = [],
  otherParticipants = [],
  isGroup = false,
  onReply,
  onQuoteClick,
}: MessageBubbleProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [infoOpen, setInfoOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [quickAnchor, setQuickAnchor] = useState<HTMLElement | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const setReaction = useSetMessageReaction();

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

  const reactions = message.reactions || [];
  const myReaction = useMemo(
    () =>
      currentUserId
        ? reactions.find((r) => getReactionUserId(r) === currentUserId)
        : undefined,
    [reactions, currentUserId],
  );

  const aggregated = useMemo(() => {
    const emojis: string[] = [];
    const seen = new Set<string>();
    for (const r of reactions) {
      if (!seen.has(r.emoji)) {
        seen.add(r.emoji);
        emojis.push(r.emoji);
      }
    }
    return { emojis, count: reactions.length };
  }, [reactions]);

  const conversationId = (() => {
    const id = message.conversationId as unknown;
    if (typeof id === 'object' && id !== null && '_id' in (id as object)) {
      return String((id as { _id: string })._id);
    }
    return String(message.conversationId || '');
  })();

  const canReact = Boolean(currentUserId && conversationId && !message._id.startsWith('temp-'));

  const handlePickEmoji = (emoji: string) => {
    if (!canReact || !currentUserId || !conversationId) return;
    setQuickAnchor(null);
    setPickerAnchor(null);
    setReaction.mutate({
      conversationId,
      messageId: message._id,
      emoji,
    });
  };

  const handlePickerSelect = (data: EmojiClickData) => {
    if (data.emoji) handlePickEmoji(data.emoji);
  };

  return (
    <>
    <Box
      data-message-id={message._id}
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        mb: reactions.length ? 2.75 : 2,
        gap: 1.25,
        '&:hover .msg-hover-action': { opacity: 1 },
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
          <Box sx={{ position: 'relative' }}>
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
                <LinkifiedText text={message.content} />
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
              {isOwn && (
                <Box
                  component="button"
                  type="button"
                  aria-label="Message info"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setInfoOpen(true);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 0,
                    m: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    lineHeight: 0,
                    borderRadius: '4px',
                    '&:hover': { opacity: 1 },
                    '&:focus-visible': {
                      outline: '1px solid rgba(255,255,255,0.7)',
                      outlineOffset: 1,
                    },
                  }}
                >
                  <TickIcon status={tickStatus} isOwn={isOwn} />
                </Box>
              )}
            </Box>
          </Paper>

          {/* Aggregated reaction pill (WhatsApp-style overlap) */}
          {aggregated.count > 0 && (
            <Box
              component="button"
              type="button"
              aria-label="View reactions"
              onClick={(e) => {
                e.stopPropagation();
                setReactionsOpen(true);
              }}
              sx={{
                position: 'absolute',
                bottom: -12,
                [isOwn ? 'right' : 'left']: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.35,
                px: 0.85,
                py: 0.2,
                minHeight: 24,
                borderRadius: '999px',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                bgcolor: isDarkMode ? 'rgba(36, 30, 46, 0.98)' : '#fff',
                boxShadow: isDarkMode
                  ? '0 2px 8px rgba(0,0,0,0.35)'
                  : '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                zIndex: 2,
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                outline: myReaction
                  ? `1.5px solid ${tokens.brand.primary}`
                  : 'none',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: isDarkMode
                    ? '0 4px 12px rgba(0,0,0,0.45)'
                    : '0 4px 12px rgba(93, 26, 137, 0.15)',
                },
              }}
            >
              <Typography
                component="span"
                sx={{ fontSize: '0.82rem', lineHeight: 1, letterSpacing: '0.02em' }}
              >
                {aggregated.emojis.slice(0, 3).join('')}
              </Typography>
              {aggregated.count > 1 && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'text.secondary',
                    ml: 0.15,
                  }}
                >
                  {aggregated.count}
                </Typography>
              )}
            </Box>
          )}
          </Box>

          {canReact && (
            <Tooltip title="Add reaction" arrow>
              <IconButton
                className="msg-hover-action"
                size="small"
                onClick={(e) => setQuickAnchor(e.currentTarget)}
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
                aria-label="Add reaction"
              >
                <AddReactionOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}

          {onReply && (
            <Tooltip title="Reply" arrow>
              <IconButton
                className="msg-hover-action"
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

    {/* Quick reaction bar — avoid MUI IconButton action.active alpha (washes emoji) */}
    <Popover
      open={Boolean(quickAnchor)}
      anchorEl={quickAnchor}
      onClose={() => setQuickAnchor(null)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '999px',
            px: 0.75,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            // Solid opaque surface (no Paper gradient / translucent wash)
            bgcolor: isDarkMode ? '#241E2E' : '#FFFFFF',
            backgroundImage: 'none',
            opacity: 1,
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: isDarkMode
              ? '0 8px 24px rgba(0,0,0,0.45)'
              : '0 8px 28px rgba(0,0,0,0.16)',
            overflow: 'visible',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          },
        },
      }}
    >
      {QUICK_REACTION_EMOJIS.map((emoji) => {
        const selected = myReaction?.emoji === emoji;
        return (
          <Tooltip
            key={emoji}
            title={selected ? 'Remove reaction' : `React with ${emoji}`}
            arrow
          >
            <Box
              component="button"
              type="button"
              onClick={() => handlePickEmoji(emoji)}
              aria-label={selected ? `Remove ${emoji} reaction` : `React with ${emoji}`}
              aria-pressed={selected}
              sx={{
                width: 36,
                height: 36,
                p: 0,
                m: 0,
                border: 'none',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.35rem',
                lineHeight: 1,
                // Full-opacity emoji (do not inherit IconButton action.active alpha)
                color: 'inherit',
                WebkitTextFillColor: 'initial',
                opacity: 1,
                bgcolor: selected
                  ? (isDarkMode ? 'rgba(93, 26, 137, 0.4)' : 'rgba(93, 26, 137, 0.14)')
                  : 'transparent',
                transition: 'transform 0.12s ease, background-color 0.12s ease',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  transform: 'scale(1.18)',
                },
              }}
            >
              {emoji}
            </Box>
          </Tooltip>
        );
      })}
      <Box
        component="button"
        type="button"
        onClick={(e) => {
          setPickerAnchor(e.currentTarget);
        }}
        aria-label="More emojis"
        sx={{
          width: 34,
          height: 34,
          p: 0,
          m: 0,
          border: 'none',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: 1,
          color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          transition: 'background-color 0.12s ease, color 0.12s ease',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)',
            color: tokens.brand.primary,
          },
        }}
      >
        <AddIcon sx={{ fontSize: 18, opacity: 1 }} />
      </Box>
    </Popover>

    {/* Full emoji picker */}
    <Popover
      open={Boolean(pickerAnchor)}
      anchorEl={pickerAnchor || quickAnchor}
      onClose={() => {
        setPickerAnchor(null);
        setQuickAnchor(null);
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            bgcolor: 'transparent',
            boxShadow: isDarkMode
              ? '0 12px 40px rgba(0,0,0,0.5)'
              : '0 12px 40px rgba(0,0,0,0.15)',
          },
        },
      }}
    >
      <ClickAwayListener
        onClickAway={() => {
          setPickerAnchor(null);
          setQuickAnchor(null);
        }}
      >
        <Box>
          <EmojiPicker
            onEmojiClick={handlePickerSelect}
            theme={isDarkMode ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            width={320}
            height={400}
            searchPlaceHolder="Search emoji"
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis
          />
        </Box>
      </ClickAwayListener>
    </Popover>

    {isOwn && (
      <MessageInfoDialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        message={message}
        participants={
          otherParticipants.length
            ? otherParticipants
            : otherParticipantIds.map((id) => ({ id, name: 'Participant' }))
        }
        isGroup={isGroup}
      />
    )}

    <MessageReactionsDialog
      open={reactionsOpen}
      onClose={() => setReactionsOpen(false)}
      message={message}
      currentUserId={currentUserId}
      onRemoveOwnReaction={
        canReact && myReaction
          ? (emoji) => {
              setReaction.mutate({
                conversationId,
                messageId: message._id,
                emoji,
              });
            }
          : undefined
      }
    />
    </>
  );
});
