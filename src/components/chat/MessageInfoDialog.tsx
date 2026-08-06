import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { tokens } from '@/styles/tokens';
import { formatDateTime } from '@/utils/formatters';
import { MESSAGE_SEEN_TICK_COLOR } from '@/lib/constants';
import { normalizeIdList, getReceiptTime } from '@/utils/chatMessageUtils';
import type { Message } from '@/types';

export interface MessageInfoParticipant {
  id: string;
  name: string;
}

interface MessageInfoDialogProps {
  open: boolean;
  onClose: () => void;
  message: Message;
  participants: MessageInfoParticipant[];
  isGroup?: boolean;
}

const formatReceiptTime = (value?: string): string => {
  if (!value) return '—';
  try {
    return formatDateTime(value);
  } catch {
    return '—';
  }
};

const ReceiptRow = ({
  label,
  value,
  acknowledged,
  seen,
}: {
  label: string;
  value?: string;
  /** True when the recipient is in deliveredTo / readBy (may lack a timestamp on legacy msgs). */
  acknowledged: boolean;
  seen?: boolean;
}) => {
  const hasValue = Boolean(value);
  const display = hasValue
    ? formatReceiptTime(value)
    : acknowledged
      ? '—'
      : label === 'Seen'
        ? 'Not seen'
        : 'Not received';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        py: 1.25,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DoneAllIcon
          sx={{
            fontSize: 16,
            color: seen && (hasValue || acknowledged) ? MESSAGE_SEEN_TICK_COLOR : 'text.secondary',
          }}
        />
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
          {label}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          fontSize: '0.78rem',
          color: hasValue ? 'text.primary' : 'text.secondary',
          textAlign: 'right',
          fontStyle: hasValue ? 'normal' : 'italic',
        }}
      >
        {display}
      </Typography>
    </Box>
  );
};

export const MessageInfoDialog = ({
  open,
  onClose,
  message,
  participants,
  isGroup = false,
}: MessageInfoDialogProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const deliveredSet = new Set(normalizeIdList(message.deliveredTo));
  const readSet = new Set(normalizeIdList(message.readBy));

  const rows = participants.map((p) => ({
    ...p,
    receivedAt: getReceiptTime(message.deliveredAt, p.id),
    seenAt: getReceiptTime(message.readAt, p.id),
    delivered: deliveredSet.has(p.id),
    read: readSet.has(p.id),
  }));

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
        Message info
        <IconButton
          aria-label="Close message info"
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
        {!isGroup && rows[0] ? (
          <Box>
            <ReceiptRow
              label="Received"
              value={rows[0].receivedAt}
              acknowledged={rows[0].delivered}
            />
            <Divider sx={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
            <ReceiptRow
              label="Seen"
              value={rows[0].seenAt}
              acknowledged={rows[0].read}
              seen
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {rows.map((row, index) => (
              <Box key={row.id}>
                {index > 0 && (
                  <Divider
                    sx={{
                      mb: 1.5,
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }}
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 800,
                    color: tokens.brand.primary,
                    mb: 0.25,
                    letterSpacing: '0.01em',
                  }}
                >
                  {row.name}
                </Typography>
                <ReceiptRow
                  label="Received"
                  value={row.receivedAt}
                  acknowledged={row.delivered}
                />
                <ReceiptRow
                  label="Seen"
                  value={row.seenAt}
                  acknowledged={row.read}
                  seen
                />
              </Box>
            ))}
            {rows.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No recipients
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
