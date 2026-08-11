import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { tokens } from '@/styles/tokens';
import { formatDateTime, getDisplayName } from '@/utils/formatters';
import type { Message, MessageReaction, User } from '@/types';

interface MessageReactionsDialogProps {
  open: boolean;
  onClose: () => void;
  message: Message;
  currentUserId?: string;
  /** Toggle-off the current user's reaction (same emoji PUT). */
  onRemoveOwnReaction?: (emoji: string) => void;
}

const getReactionUser = (reaction: MessageReaction): User | undefined =>
  typeof reaction.userId === 'object' && reaction.userId !== null
    ? reaction.userId
    : undefined;

const getReactionUserId = (reaction: MessageReaction): string =>
  typeof reaction.userId === 'string' ? reaction.userId : reaction.userId._id;

const formatReactionTime = (value?: string): string => {
  if (!value) return '—';
  try {
    return formatDateTime(value);
  } catch {
    return '—';
  }
};

export const MessageReactionsDialog = ({
  open,
  onClose,
  message,
  currentUserId,
  onRemoveOwnReaction,
}: MessageReactionsDialogProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const reactions = [...(message.reactions || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          bgcolor: isDarkMode ? 'rgba(28, 22, 36, 0.98)' : '#fff',
          backgroundImage: 'none',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isDarkMode
            ? '0 20px 50px rgba(0,0,0,0.45)'
            : '0 16px 40px rgba(93, 26, 137, 0.12)',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          fontSize: '1rem',
          pr: 6,
          pb: 1.25,
        }}
      >
        Reactions
        <IconButton
          aria-label="Close reactions"
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: 'text.secondary',
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '4px !important', pb: 2.5, px: 3 }}>
        {reactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No reactions yet
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {reactions.map((reaction, index) => {
              const user = getReactionUser(reaction);
              const userId = getReactionUserId(reaction);
              const isOwn = Boolean(currentUserId && userId === currentUserId);
              const displayName = getDisplayName(user);
              const name = isOwn
                ? 'You'
                : displayName !== 'Unknown'
                  ? displayName
                  : 'Someone';
              const canRemove = isOwn && Boolean(onRemoveOwnReaction);
              const key = `${userId}-${reaction.emoji}-${reaction.createdAt}`;
              return (
                <Box key={key}>
                  {index > 0 && (
                    <Divider
                      sx={{
                        mb: 0.5,
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      py: 1.1,
                      borderRadius: '12px',
                      px: canRemove ? 0.75 : 0,
                      mx: canRemove ? -0.75 : 0,
                      cursor: canRemove ? 'pointer' : 'default',
                      transition: 'background-color 0.12s ease',
                      '&:hover': canRemove
                        ? {
                            bgcolor: isDarkMode
                              ? 'rgba(255,255,255,0.04)'
                              : 'rgba(93, 26, 137, 0.04)',
                          }
                        : undefined,
                    }}
                    onClick={
                      canRemove
                        ? () => {
                            onRemoveOwnReaction?.(reaction.emoji);
                            onClose();
                          }
                        : undefined
                    }
                    role={canRemove ? 'button' : undefined}
                    tabIndex={canRemove ? 0 : undefined}
                    aria-label={canRemove ? 'Remove your reaction' : undefined}
                    onKeyDown={
                      canRemove
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onRemoveOwnReaction?.(reaction.emoji);
                              onClose();
                            }
                          }
                        : undefined
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                      <Typography
                        component="span"
                        sx={{ fontSize: '1.25rem', lineHeight: 1 }}
                        aria-hidden
                      >
                        {reaction.emoji}
                      </Typography>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: tokens.brand.primary,
                          }}
                          noWrap
                        >
                          {name}
                        </Typography>
                        {canRemove && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              fontSize: '0.68rem',
                              color: 'text.secondary',
                              lineHeight: 1.2,
                            }}
                          >
                            Tap to remove
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    {canRemove ? (
                      <Button
                        size="small"
                        color="inherit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveOwnReaction?.(reaction.emoji);
                          onClose();
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          minWidth: 0,
                          px: 1,
                          color: 'text.secondary',
                          '&:hover': { color: tokens.brand.primary, bgcolor: 'transparent' },
                        }}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.72rem',
                          color: 'text.secondary',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatReactionTime(reaction.createdAt)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
