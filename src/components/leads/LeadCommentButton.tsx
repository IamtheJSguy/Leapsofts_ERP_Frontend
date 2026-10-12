import { memo, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { leadCommentLevelTokens } from '@/styles/tokens';
import { toPlainText } from '@/components/common/RichTextContent';
import type { LeadCommentFormat, LeadCommentLevel, User } from '@/types';
import { getLatestLeadComment } from '@/utils/getLatestLeadComment';
import { LeadCommentComposer, emptyCommentDraft, type LeadCommentDraft } from './LeadCommentComposer';
import { LeadCommentBody } from './LeadCommentBody';

export type LeadCommentAddPayload = {
  text: string;
  level: LeadCommentLevel;
  format?: LeadCommentFormat;
};

type LeadCommentButtonProps = {
  comments?: Array<{ text: string; level: LeadCommentLevel; format?: LeadCommentFormat; updatedAt?: string; createdAt?: string }>;
  /** Legacy: single latest mirror when leadComments not loaded */
  comment?: { text: string; level: LeadCommentLevel; format?: LeadCommentFormat } | null;
  onAdd: (comment: LeadCommentAddPayload) => void;
  /** Toggle to true to force-open the dialog (e.g. when messageStatus becomes invalid_lead). */
  promptOpen?: boolean;
  onPromptHandled?: () => void;
  requireReason?: boolean;
  mentionableUsers?: User[];
  size?: 'small' | 'medium';
  saving?: boolean;
};

export const LeadCommentButton = memo(function LeadCommentButton({
  comments,
  comment,
  onAdd,
  promptOpen,
  onPromptHandled,
  requireReason,
  mentionableUsers = [],
  size = 'small',
  saving,
}: LeadCommentButtonProps) {
  const latest = getLatestLeadComment(
    comments?.length
      ? { leadComments: comments.map((c) => ({ ...c, text: c.text, level: c.level })) }
      : { leadComment: comment ?? undefined },
  );

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LeadCommentDraft>(() => emptyCommentDraft(requireReason ? 'red' : 'yellow'));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (promptOpen) {
      setDraft(emptyCommentDraft(requireReason ? 'red' : 'yellow'));
      setError(false);
      setOpen(true);
      onPromptHandled?.();
    }
  }, [promptOpen, onPromptHandled, requireReason]);

  const handleOpen = () => {
    setDraft(emptyCommentDraft(requireReason ? 'red' : 'yellow'));
    setError(false);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    if (!toPlainText(draft.text).trim()) {
      setError(true);
      return;
    }
    onAdd({
      text: draft.text,
      level: draft.level,
      format: draft.format ?? 'html',
    });
    setOpen(false);
  };

  const latestFormat = latest && 'format' in latest ? latest.format : undefined;
  const hasLatestComment =
    !!latest?.text
    && (latestFormat === 'html' ? toPlainText(latest.text).trim() : latest.text.trim());

  const color = hasLatestComment ? leadCommentLevelTokens[latest!.level] : 'rgba(148, 163, 184, 0.7)';

  const tooltipTitle = open
    ? ''
    : hasLatestComment
      ? (
          <Box
            sx={{
              maxWidth: 320,
              maxHeight: 240,
              overflow: 'auto',
              textAlign: 'left',
              color: 'inherit',
              '& p': { m: 0, mb: 0.5 },
              '& p:last-child': { mb: 0 },
            }}
          >
            <LeadCommentBody
              text={latest!.text}
              format={latestFormat ?? 'plain'}
              variant="caption"
              mentionableUsers={mentionableUsers}
            />
          </Box>
        )
      : 'Add comment';

  return (
    <>
      <Tooltip
        title={tooltipTitle}
        arrow
        disableInteractive={false}
        slotProps={{
          tooltip: {
            sx: {
              maxWidth: 'none',
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 3,
              border: '1px solid',
              borderColor: 'divider',
              p: 1.25,
            },
          },
        }}
      >
        <IconButton
          size={size}
          onClick={handleOpen}
          sx={{
            color,
            alignSelf: 'center',
            flexShrink: 0,
            width: size === 'small' ? 32 : 40,
            height: size === 'small' ? 32 : 40,
            borderRadius: '50%',
          }}
        >
          {hasLatestComment ? (
            <ChatBubbleIcon sx={{ fontSize: size === 'small' ? 18 : 20 }} />
          ) : (
            <ChatBubbleOutlineIcon sx={{ fontSize: size === 'small' ? 18 : 20 }} />
          )}
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { width: '100%', maxWidth: 520 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          {requireReason ? 'Reason for Invalid Lead' : 'Add lead comment'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Comments are saved to the history. Previous notes stay on the lead.
          </Typography>
          <LeadCommentComposer
            value={draft}
            onChange={setDraft}
            error={error}
            helperText={error ? 'A comment is required.' : undefined}
            requireReason={requireReason}
            mentionableUsers={mentionableUsers}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Save comment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
