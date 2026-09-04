import { useState, type MouseEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useAddSalesKpiComment } from '@/hooks/api/useSalesKpis';
import { SALES_KPI_METRIC_LABELS, SALES_KPI_STATUS_LABELS } from '@/lib/constants';
import { tokens } from '@/styles/tokens';
import { formatKpiDueDate } from '@/utils/formatters';
import type { SalesKpiEntry, SalesKpiStatus } from '@/types';

const STATUS_COLORS: Record<SalesKpiStatus, string> = {
  pending: tokens.semantic.neutral,
  in_progress: tokens.brand.primary,
  completed_on_time: tokens.semantic.success,
  completed_late: tokens.semantic.warning,
  missed: tokens.semantic.error,
  partial: tokens.semantic.warning,
};

const isDone = (status: SalesKpiStatus) => status === 'completed_on_time' || status === 'completed_late';
/** Only incomplete/overdue entries may carry a user-provided reason/comment. */
const isCommentable = (status: SalesKpiStatus) => status === 'missed' || status === 'partial';

const toPlainText = (value?: string): string => {
  if (!value) return '';
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Card for an auto-generated sales KPI. Progress comes from the pipeline, never from
 * the user — the only user input allowed is an explanatory comment on incomplete/overdue
 * entries. Pass `canEdit={false}` for read-only contexts (e.g. admin/manager team views).
 * Use `variant="board"` on the My Tasks kanban so the card stays compact.
 */
export const SalesKpiEntryCard = ({
  entry,
  canEdit = true,
  variant = 'default',
}: {
  entry: SalesKpiEntry;
  canEdit?: boolean;
  variant?: 'default' | 'board';
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const addComment = useAddSalesKpiComment();

  const target = entry.targetValue ?? 0;
  const current = entry.currentValue ?? 0;
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : isDone(entry.status) ? 100 : 0;
  const statusColor = STATUS_COLORS[entry.status] ?? tokens.semantic.neutral;
  const completed = isDone(entry.status);
  const commentable = isCommentable(entry.status);
  const board = variant === 'board';
  const description = toPlainText(entry.description);

  const openCommentDialog = (e?: MouseEvent) => {
    e?.stopPropagation();
    setCommentInput(entry.comment ?? '');
    setCommentDialogOpen(true);
  };

  const saveComment = () => {
    const comment = commentInput.trim();
    if (!comment) return;
    addComment.mutate(
      { id: entry._id, comment },
      { onSuccess: () => setCommentDialogOpen(false) },
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        px: 1.25,
        py: 1,
        minHeight: board ? 72 : undefined,
        borderRadius: `${tokens.radius.md}px`,
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : tokens.surface.border}`,
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : tokens.surface.card,
        boxShadow: tokens.shadow.card,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          noWrap
          title={entry.kpiName}
          sx={{
            flex: 1,
            minWidth: 0,
            fontWeight: 650,
            fontSize: '0.875rem',
            lineHeight: 1.25,
            color: completed ? 'text.disabled' : tokens.text.primary,
            letterSpacing: '-0.01em',
          }}
        >
          {entry.kpiName}
        </Typography>
        {board && completed && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.35,
              height: 26,
              px: 0.75,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              color: tokens.semantic.success,
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 14 }} />
            <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.7rem', lineHeight: 1 }}>
              Done
            </Typography>
          </Box>
        )}
        {canEdit && commentable && (
          <IconButton
            size="small"
            onClick={openCommentDialog}
            title={entry.comment ? 'Edit reason' : 'Add reason'}
            sx={{ width: 28, height: 28, color: tokens.brand.primary, flexShrink: 0 }}
          >
            <EditNoteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <Typography
          variant="caption"
          noWrap
          sx={{ color: tokens.text.secondary, fontWeight: 500, fontVariantNumeric: 'tabular-nums', minWidth: 0 }}
        >
          {formatKpiDueDate(entry.periodEnd, { includeTime: true })}
        </Typography>
        <Chip
          label={SALES_KPI_STATUS_LABELS[entry.status] ?? entry.status}
          size="small"
          sx={{ flexShrink: 0, fontWeight: 700, fontSize: '0.65rem', height: 20, bgcolor: `${statusColor}1A`, color: statusColor }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 650, color: tokens.brand.primary }}>
          {current} / {target} {target > 0 ? `(${percent}%)` : ''} · {SALES_KPI_METRIC_LABELS[entry.metric] ?? entry.metric}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            height: 6,
            borderRadius: 999,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            '& .MuiLinearProgress-bar': { borderRadius: 999, backgroundColor: statusColor },
          }}
        />
        {description.length >= 8 && (
          <Typography
            variant="caption"
            sx={{
              color: tokens.text.muted,
              fontWeight: 500,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
        )}
        {entry.comment && (
          <Typography variant="caption" sx={{ color: tokens.semantic.warning, fontWeight: 600 }}>
            Reason: {entry.comment}
          </Typography>
        )}
      </Box>

      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {entry.comment ? 'Edit reason' : 'Add reason'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}>
            {entry.kpiName}
          </Typography>
          <TextField
            label="Reason / comment"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            autoFocus
            inputProps={{ maxLength: 1000 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCommentDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveComment}
            disabled={!commentInput.trim() || addComment.isPending}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
