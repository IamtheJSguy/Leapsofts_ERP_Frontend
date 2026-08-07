import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { WeekdayPicker } from '@/components/kpi/WeekdayPicker';
import {
  useDeleteSalesKpiAssignment,
  useSalesKpiAssignments,
  useUpdateSalesKpiAssignment,
} from '@/hooks/api/useSalesKpis';
import { SALES_KPI_METRIC_LABELS } from '@/lib/constants';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import { defaultTargetModeForMetric, isManualTarget } from '@/lib/salesKpi';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type {
  KpiPriority,
  SalesKpiAssignment,
  SalesKpiAssignmentItem,
  SalesKpiAssignmentItemUpdate,
  SalesKpiTargetMode,
  User,
} from '@/types';

interface DraftItem {
  /** Assignment item subdocument `_id` — the key the PUT payload is matched on. */
  _id: string;
  name: string;
  metric: SalesKpiAssignmentItem['metric'];
  scheduleMode: SalesKpiAssignmentItem['scheduleMode'];
  targetMode: SalesKpiTargetMode;
  daysOfWeek: number[];
  targetValue: string;
  priority: KpiPriority;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const formatUser = (u: string | User | undefined) => {
  if (!u || typeof u === 'string') return 'Unknown user';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
};

const templateName = (assignment: SalesKpiAssignment) =>
  typeof assignment.templateId === 'string' || !assignment.templateId
    ? 'Sales KPI template'
    : assignment.templateId.name;

const toDrafts = (assignment: SalesKpiAssignment): DraftItem[] =>
  (assignment.items ?? []).map((item) => ({
    _id: item._id,
    name: item.name,
    metric: item.metric,
    scheduleMode: item.scheduleMode,
    targetMode: item.targetMode ?? defaultTargetModeForMetric(item.metric),
    daysOfWeek: item.daysOfWeek ?? [],
    targetValue: item.targetValue != null ? String(item.targetValue) : '',
    priority: item.priority ?? 'medium',
    startTime: item.startTime ?? '',
    endTime: item.endTime ?? '',
    isActive: item.isActive ?? true,
  }));

/** Same-day windows require start before end when both times are set. */
const invalidTimeWindow = (d: DraftItem) => {
  if (!d.startTime || !d.endTime) return false;
  const sameDay = d.scheduleMode !== 'span' || d.daysOfWeek.length <= 1;
  return sameDay && d.startTime >= d.endTime;
};

/** The backend rejects an empty daysOfWeek on any item it receives, paused or not. */
const invalidDraft = (d: DraftItem) =>
  d.daysOfWeek.length === 0
  || invalidTimeWindow(d)
  || (isManualTarget(d.targetMode)
    && (d.targetValue.trim() === '' || Number.isNaN(Number(d.targetValue)) || Number(d.targetValue) < 0));

const AssignmentCard = ({ assignment }: { assignment: SalesKpiAssignment }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);
  const updateMutation = useUpdateSalesKpiAssignment();
  const deleteMutation = useDeleteSalesKpiAssignment();

  const [drafts, setDrafts] = useState<DraftItem[]>(() => toDrafts(assignment));
  const [dirty, setDirty] = useState(false);

  const patch = (id: string, next: Partial<DraftItem>) => {
    setDrafts((prev) => prev.map((d) => (d._id === id ? { ...d, ...next } : d)));
    setDirty(true);
  };

  const invalid = drafts.some(invalidDraft);

  const handleSave = async () => {
    const items: SalesKpiAssignmentItemUpdate[] = drafts.map((d) => ({
      _id: d._id,
      daysOfWeek: [...d.daysOfWeek].sort((a, b) => a - b),
      scheduleMode: d.scheduleMode,
      priority: d.priority,
      isActive: d.isActive,
      startTime: d.startTime || null,
      endTime: d.endTime || null,
      // Only manual items carry a target; auto_snapshot items take theirs from the pipeline.
      ...(isManualTarget(d.targetMode) ? { targetValue: Number(d.targetValue) } : {}),
    }));

    try {
      await updateMutation.mutateAsync({ id: assignment._id, items });
      addToast({ message: 'Assignment updated.', severity: 'success' });
      setDirty(false);
    } catch {
      addToast({ message: 'Failed to update the assignment.', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(assignment._id);
      addToast({ message: 'Assignment removed.', severity: 'success' });
    } catch {
      addToast({ message: 'Failed to remove the assignment.', severity: 'error' });
    }
  };

  const userName = formatUser(assignment.userId);

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
    },
  };

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: '24px',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
        boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.1)', color: tokens.brand.primary, fontWeight: 800, width: 44, height: 44 }}>
          {userName.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{userName}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {templateName(assignment)} · {drafts.filter((d) => d.isActive).length} active of {drafts.length}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          sx={{ color: tokens.semantic.error, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {drafts.map((d) => {
          const manual = isManualTarget(d.targetMode);
          return (
            <Box
              key={d._id}
              sx={{
                p: 2,
                borderRadius: '18px',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                opacity: d.isActive ? 1 : 0.55,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                alignItems: { xs: 'stretch', md: 'center' },
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ minWidth: 180, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{d.name}</Typography>
                <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={SALES_KPI_METRIC_LABELS[d.metric] ?? d.metric}
                    size="small"
                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary }}
                  />
                  <Chip
                    label={d.scheduleMode === 'span' ? 'Single task' : 'Per day'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: 'text.secondary' }}
                  />
                </Box>
              </Box>

              <WeekdayPicker
                size="small"
                value={d.daysOfWeek}
                onChange={(daysOfWeek) => patch(d._id, { daysOfWeek })}
                disabled={!d.isActive}
              />

              {manual && (
                <TextField
                  label="Target"
                  type="number"
                  size="small"
                  value={d.targetValue}
                  onChange={(e) => patch(d._id, { targetValue: e.target.value })}
                  disabled={!d.isActive}
                  inputProps={{ min: 1 }}
                  sx={{ width: 110, ...textFieldStyle }}
                />
              )}

              <TextField
                select
                label="Priority"
                size="small"
                value={d.priority}
                onChange={(e) => patch(d._id, { priority: e.target.value as KpiPriority })}
                disabled={!d.isActive}
                sx={{ width: 130, ...textFieldStyle }}
              >
                {KPI_PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Start"
                type="time"
                size="small"
                value={d.startTime}
                onChange={(e) => patch(d._id, { startTime: e.target.value })}
                disabled={!d.isActive}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
                sx={{ width: 130, ...textFieldStyle }}
              />
              <TextField
                label="End"
                type="time"
                size="small"
                value={d.endTime}
                onChange={(e) => patch(d._id, { endTime: e.target.value })}
                disabled={!d.isActive}
                error={invalidTimeWindow(d)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
                sx={{ width: 130, ...textFieldStyle }}
              />

              <Button
                size="small"
                startIcon={d.isActive ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                onClick={() => patch(d._id, { isActive: !d.isActive })}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', color: d.isActive ? tokens.text.secondary : tokens.brand.primary }}
              >
                {d.isActive ? 'Pause' : 'Resume'}
              </Button>
            </Box>
          );
        })}
        {drafts.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 600 }}>
            This assignment has no items.
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button
          onClick={() => { setDrafts(toDrafts(assignment)); setDirty(false); }}
          disabled={!dirty || updateMutation.isPending}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: tokens.text.secondary }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!dirty || invalid || updateMutation.isPending}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '12px',
            px: 3,
            boxShadow: 'none',
            bgcolor: tokens.brand.primary,
            '&:hover': { bgcolor: tokens.brand.primary, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
          }}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </Box>
    </Card>
  );
};

export const SalesKpiAssignmentsPanel = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { data: assignments = [], isLoading } = useSalesKpiAssignments();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  if (assignments.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, boxShadow: 'none' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: tokens.text.secondary }}>No assignees yet</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Assign a sales KPI template to a team member to start generating daily tasks.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {assignments.map((assignment) => (
        // Remount on server-side change so the inline drafts pick up fresh values.
        <AssignmentCard key={`${assignment._id}:${assignment.updatedAt ?? ''}`} assignment={assignment} />
      ))}
    </Box>
  );
};
