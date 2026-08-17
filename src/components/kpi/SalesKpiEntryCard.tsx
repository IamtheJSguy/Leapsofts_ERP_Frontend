import { useState } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { PriorityBadge } from '@/components/kpi/PriorityBadge';
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

/**
 * Card for an auto-generated sales KPI. Progress comes from the pipeline, never from
 * the user — the only user input allowed is an explanatory comment on incomplete/overdue
 * entries. Pass `canEdit={false}` for read-only contexts (e.g. admin/manager team views).
 */
export const SalesKpiEntryCard = ({
  entry,
  canEdit = true,
}: {
  entry: SalesKpiEntry;
  canEdit?: boolean;
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

  const openCommentDialog = () => {
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
        borderRadius: '20px',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
        boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.02)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {completed ? (
            <CheckCircleIcon sx={{ fontSize: 26, color: tokens.semantic.success }} />
          ) : entry.status === 'missed' ? (
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WarningRoundedIcon sx={{ fontSize: 20, color: tokens.semantic.error }} />
            </Box>
          ) : (
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(93, 26, 137, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrackChangesIcon sx={{ fontSize: 20, color: tokens.brand.primary }} />
            </Box>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 750, fontSize: '1rem', color: completed ? 'text.disabled' : tokens.text.primary, letterSpacing: '-0.01em' }}>
              {entry.kpiName}
            </Typography>
            <PriorityBadge priority={entry.priority} />
            <Chip
              icon={<TrackChangesOutlinedIcon sx={{ fontSize: 14 }} />}
              label={`Auto-tracked: ${SALES_KPI_METRIC_LABELS[entry.metric] ?? entry.metric}`}
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary }}
            />
            {entry.scheduleMode === 'span' && (
              <Chip
                label="Multi-day"
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: 'text.secondary' }}
              />
            )}
          </Box>
          {entry.description && (
            <Typography
              variant="caption"
              sx={{
                color: tokens.text.muted,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {entry.description}
            </Typography>
          )}
          {entry.comment && (
            <Typography
              variant="caption"
              sx={{
                color: tokens.semantic.warning,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              Reason: {entry.comment}
            </Typography>
          )}
        </Box>

        {canEdit && commentable && (
          <IconButton
            size="small"
            onClick={openCommentDialog}
            title={entry.comment ? 'Edit reason' : 'Add reason'}
            sx={{ color: tokens.brand.primary }}
          >
            <EditNoteIcon fontSize="small" />
          </IconButton>
        )}

        <Chip
          label={SALES_KPI_STATUS_LABELS[entry.status] ?? entry.status}
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22, bgcolor: `${statusColor}1A`, color: statusColor, border: 'none' }}
        />
      </Box>

      <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrackChangesIcon sx={{ fontSize: 14 }} />
            {current} / {target} {target > 0 ? `(${percent}%)` : ''}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EventNoteIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Due {formatKpiDueDate(entry.periodEnd, { includeTime: true })}
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            height: 8,
            borderRadius: 999,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            '& .MuiLinearProgress-bar': { borderRadius: 999, backgroundColor: statusColor },
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
          Progress updates automatically from your pipeline activity.
        </Typography>
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
