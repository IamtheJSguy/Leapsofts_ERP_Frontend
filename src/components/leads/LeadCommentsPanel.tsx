import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { leadCommentLevelTokens } from '@/styles/tokens';
import type { Lead, LeadCommentEntry, User } from '@/types';
import { formatDateTime } from '@/utils/formatters';
import { toPlainText } from '@/components/common/RichTextContent';
import { LeadCommentComposer, emptyCommentDraft, type LeadCommentDraft } from './LeadCommentComposer';
import { LeadCommentBody } from './LeadCommentBody';

const userName = (user?: string | User): string => {
  if (!user || typeof user === 'string') return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
};

const sortNewestFirst = (entries: LeadCommentEntry[]): LeadCommentEntry[] =>
  [...entries].sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });

type Props = {
  lead: Lead;
  disabled?: boolean;
  mentionableUsers?: User[];
  onAdd: (draft: LeadCommentDraft) => Promise<void>;
  onUpdate: (commentId: string, draft: LeadCommentDraft) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
};

export function LeadCommentsPanel({ lead, disabled, mentionableUsers = [], onAdd, onUpdate, onDelete }: Props) {
  const comments = useMemo(() => sortNewestFirst(lead.leadComments ?? []), [lead.leadComments]);
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState<LeadCommentDraft>(() => emptyCommentDraft());
  const [addError, setAddError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<LeadCommentDraft>(() => emptyCommentDraft());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startEdit = (entry: LeadCommentEntry) => {
    if (!entry._id) return;
    setEditingId(entry._id);
    setEditDraft({
      text: entry.text,
      level: entry.level,
      format: 'html',
    });
  };

  const submitAdd = async () => {
    if (!toPlainText(addDraft.text).trim()) {
      setAddError(true);
      return;
    }
    setBusy(true);
    try {
      await onAdd(addDraft);
      setAddDraft(emptyCommentDraft());
      setAdding(false);
      setAddError(false);
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!editingId || !toPlainText(editDraft.text).trim()) return;
    setBusy(true);
    try {
      await onUpdate(editingId, editDraft);
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setBusy(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 750, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} /> Lead comments
        </Typography>
        {!adding && (
          <Button
            size="small"
            onClick={() => {
              setAddDraft(emptyCommentDraft());
              setAdding(true);
            }}
            disabled={disabled || busy}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Add comment
          </Button>
        )}
      </Box>

      <Collapse in={adding}>
        <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <LeadCommentComposer
            value={addDraft}
            onChange={setAddDraft}
            error={addError}
            mentionableUsers={mentionableUsers}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button size="small" onClick={() => setAdding(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={() => void submitAdd()} disabled={busy}>
              Save
            </Button>
          </Stack>
        </Box>
      </Collapse>

      <Stack spacing={1}>
        {comments.length === 0 && !adding && (
          <Typography variant="caption" color="text.secondary">
            No comments yet. Use the table icon or Add comment here.
          </Typography>
        )}
        {comments.map((entry) => {
          const isEditing = editingId === entry._id;
          const author = userName(entry.updatedBy ?? entry.createdBy);
          const when = formatDateTime(entry.updatedAt || entry.createdAt || '');
          return (
            <Box
              key={entry._id || `${entry.text}-${when}`}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                <Chip
                  size="small"
                  label={entry.level}
                  sx={{
                    height: 22,
                    bgcolor: `${leadCommentLevelTokens[entry.level]}22`,
                    color: leadCommentLevelTokens[entry.level],
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                  {author ? `${author} · ` : ''}
                  {when || '—'}
                </Typography>
                {!isEditing && entry._id && (
                  <Stack direction="row" spacing={0.25}>
                    <IconButton size="small" onClick={() => startEdit(entry)} disabled={disabled || busy}>
                      <EditOutlinedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteId(entry._id!)} disabled={disabled || busy}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
              {isEditing ? (
                <>
                  <LeadCommentComposer
                    value={editDraft}
                    onChange={setEditDraft}
                    mentionableUsers={mentionableUsers}
                  />
                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                    <Button size="small" onClick={() => setEditingId(null)} disabled={busy}>
                      Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={() => void submitEdit()} disabled={busy}>
                      Update
                    </Button>
                  </Stack>
                </>
              ) : (
                <LeadCommentBody
                  text={entry.text}
                  format={entry.format}
                  mentionableUsers={mentionableUsers}
                />
              )}
            </Box>
          );
        })}
      </Stack>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete comment?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This cannot be undone. Invalid leads must keep at least one comment.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={busy}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={() => void confirmDelete()} disabled={busy}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
