import { memo, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { leadCommentLevelTokens } from '@/styles/tokens';
import type { LeadComment, LeadCommentLevel } from '@/types';

const LEVELS: { value: LeadCommentLevel; label: string }[] = [
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'red', label: 'Red' },
];

type LeadCommentButtonProps = {
  comment?: LeadComment;
  onSave: (comment: LeadComment) => void;
  /** Toggle to true to force-open the popover (e.g. when messageStatus becomes invalid_lead). */
  promptOpen?: boolean;
  onPromptHandled?: () => void;
  requireReason?: boolean;
  size?: 'small' | 'medium';
};

export const LeadCommentButton = memo(function LeadCommentButton({
  comment,
  onSave,
  promptOpen,
  onPromptHandled,
  requireReason,
  size = 'small',
}: LeadCommentButtonProps) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(comment?.text || '');
  const [level, setLevel] = useState<LeadCommentLevel>(comment?.level || 'yellow');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (promptOpen) {
      setText(comment?.text || '');
      setLevel(comment?.level || 'red');
      setError(false);
      setOpen(true);
      onPromptHandled?.();
    }
  }, [promptOpen, comment, onPromptHandled]);

  const handleOpen = () => {
    setText(comment?.text || '');
    setLevel(comment?.level || 'yellow');
    setError(false);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    if (!text.trim()) {
      setError(true);
      return;
    }
    onSave({ text: text.trim(), level });
    setOpen(false);
  };

  const color = comment?.text ? leadCommentLevelTokens[comment.level] : 'rgba(148, 163, 184, 0.7)';
  const tooltipTitle = comment?.text ? comment.text : 'Add comment';

  return (
    <>
      <Tooltip title={open ? '' : tooltipTitle} arrow>
        <IconButton ref={anchorRef} size={size} onClick={handleOpen} sx={{ color }}>
          {comment?.text ? (
            <ChatBubbleIcon sx={{ fontSize: size === 'small' ? 18 : 20 }} />
          ) : (
            <ChatBubbleOutlineIcon sx={{ fontSize: size === 'small' ? 18 : 20 }} />
          )}
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClick={(e) => e.stopPropagation()}
        slotProps={{ paper: { sx: { p: 2, width: 300 } } }}
      >
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {requireReason ? 'Reason for Invalid Lead' : 'Lead Comment'}
          </Typography>
          <TextField
            autoFocus
            multiline
            minRows={2}
            maxRows={5}
            size="small"
            placeholder={requireReason ? 'Explain why this lead is invalid…' : 'Add a comment…'}
            value={text}
            error={error}
            helperText={error ? 'A comment is required.' : ' '}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
          />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block' }}>
              Priority level
            </Typography>
            <Stack direction="row" spacing={1}>
              {LEVELS.map((l) => (
                <Button
                  key={l.value}
                  size="small"
                  variant={level === l.value ? 'contained' : 'outlined'}
                  onClick={() => setLevel(l.value)}
                  startIcon={
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: leadCommentLevelTokens[l.value],
                      }}
                    />
                  }
                  sx={{
                    minWidth: 0,
                    px: 1,
                    borderColor: leadCommentLevelTokens[l.value],
                    color: level === l.value ? '#fff' : leadCommentLevelTokens[l.value],
                    bgcolor: level === l.value ? leadCommentLevelTokens[l.value] : 'transparent',
                    '&:hover': {
                      bgcolor: level === l.value ? leadCommentLevelTokens[l.value] : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  {l.label}
                </Button>
              ))}
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleSave}>
              Save
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
});
