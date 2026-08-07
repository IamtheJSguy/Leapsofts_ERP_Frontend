import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { WeekdayPicker } from '@/components/kpi/WeekdayPicker';
import {
  useAssignSalesKpiTemplate,
  useCreateSalesKpiTemplate,
  useUpdateSalesKpiTemplate,
  type SalesKpiTemplatePayload,
} from '@/hooks/api/useSalesKpis';
import { useUsers } from '@/hooks/api/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { SALES_KPI_METRIC_LABELS, SALES_KPI_METRIC_OPTIONS } from '@/lib/constants';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import { defaultTargetModeForMetric, isManualTarget } from '@/lib/salesKpi';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type {
  KpiPriority,
  SalesKpiMetric,
  SalesKpiScheduleMode,
  SalesKpiTargetMode,
  SalesKpiTemplate,
  SalesKpiTemplateItem,
  User,
} from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  template?: SalesKpiTemplate | null;
}

interface DraftItem {
  key: string;
  name: string;
  description: string;
  metric: SalesKpiMetric;
  daysOfWeek: number[];
  scheduleMode: SalesKpiScheduleMode;
  targetMode: SalesKpiTargetMode;
  targetValue: string;
  priority: KpiPriority;
  /** Optional `HH:mm`; empty = start of day. */
  startTime: string;
  /** Optional `HH:mm`; empty = end of day (midnight). */
  endTime: string;
}

let draftKeySeq = 0;
const nextKey = () => `item-${draftKeySeq++}`;

const makeItem = (): DraftItem => ({
  key: nextKey(),
  name: '',
  description: '',
  metric: 'new_prospects',
  daysOfWeek: [1, 2, 3, 4, 5],
  scheduleMode: 'per_day',
  targetMode: defaultTargetModeForMetric('new_prospects'),
  targetValue: '',
  priority: 'medium',
  startTime: '',
  endTime: '',
});

const toDraft = (item: SalesKpiTemplateItem): DraftItem => ({
  key: item._id ?? nextKey(),
  name: item.name,
  description: item.description ?? '',
  metric: item.metric,
  daysOfWeek: item.daysOfWeek ?? [],
  scheduleMode: item.scheduleMode ?? 'per_day',
  targetMode: item.targetMode ?? defaultTargetModeForMetric(item.metric),
  targetValue: item.targetValue != null ? String(item.targetValue) : '',
  priority: item.priority ?? 'medium',
  startTime: item.startTime ?? '',
  endTime: item.endTime ?? '',
});

/** Backend accepts any target >= 0, but it must be present for a manual item. */
const invalidTarget = (item: DraftItem) =>
  isManualTarget(item.targetMode)
  && (item.targetValue.trim() === '' || Number.isNaN(Number(item.targetValue)) || Number(item.targetValue) < 0);

/** Same-day windows require start before end when both times are set. */
const invalidTimeWindow = (item: DraftItem) => {
  if (!item.startTime || !item.endTime) return false;
  const sameDay = item.scheduleMode !== 'span' || item.daysOfWeek.length <= 1;
  return sameDay && item.startTime >= item.endTime;
};

export const SalesKpiTemplateForm = ({ open, onClose, template }: Props) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);
  const { isAdmin } = useAuth();
  const { data: users = [] } = useUsers();
  const createMutation = useCreateSalesKpiTemplate();
  const updateMutation = useUpdateSalesKpiTemplate();
  const assignMutation = useAssignSalesKpiTemplate();

  const isEditing = !!template;
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [items, setItems] = useState<DraftItem[]>(() =>
    template?.items?.length ? template.items.map(toDraft) : [makeItem()],
  );
  const [assignUsers, setAssignUsers] = useState<User[]>([]);

  const assignableUsers = users.filter((u) =>
    isAdmin ? u.role === 'user' || u.role === 'manager' : u.role === 'user',
  );

  const patchItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const changeMetric = (index: number, metric: SalesKpiMetric) => {
    const targetMode = defaultTargetModeForMetric(metric);
    patchItem(index, {
      metric,
      targetMode,
      targetValue: isManualTarget(targetMode) ? items[index].targetValue : '',
    });
  };

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const invalidItem = items.find(
    (item) =>
      !item.name.trim()
      || item.daysOfWeek.length === 0
      || invalidTarget(item)
      || invalidTimeWindow(item),
  );

  const canSave = !!name.trim() && items.length > 0 && !invalidItem;
  const isPending =
    createMutation.isPending || updateMutation.isPending || assignMutation.isPending;

  const handleSave = async () => {
    if (!canSave) return;

    const payload: SalesKpiTemplatePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      items: items.map(
        (item) =>
          ({
            name: item.name.trim(),
            description: item.description.trim() || undefined,
            metric: item.metric,
            daysOfWeek: [...item.daysOfWeek].sort((a, b) => a - b),
            scheduleMode: item.scheduleMode,
            targetMode: item.targetMode,
            targetValue: isManualTarget(item.targetMode) ? Number(item.targetValue) : undefined,
            priority: item.priority,
            startTime: item.startTime || null,
            endTime: item.endTime || null,
          }) satisfies SalesKpiTemplateItem,
      ),
    };

    try {
      if (template) {
        await updateMutation.mutateAsync({ id: template._id, data: payload });
        addToast({ message: 'Sales KPI template updated.', severity: 'success' });
      } else {
        const created = await createMutation.mutateAsync(payload);
        const createdTemplate = created.data.data;
        if (assignUsers.length > 0) {
          try {
            await assignMutation.mutateAsync({
              id: createdTemplate._id,
              userIds: assignUsers.map((u) => u._id),
            });
            addToast({
              message: `Sales KPI template created and assigned to ${assignUsers.length} user${assignUsers.length === 1 ? '' : 's'}.`,
              severity: 'success',
            });
          } catch {
            addToast({
              message: 'Template created, but assignment failed. You can assign it from the list.',
              severity: 'warning',
            });
          }
        } else {
          addToast({ message: 'Sales KPI template created.', severity: 'success' });
        }
      }
      onClose();
    } catch {
      addToast({ message: 'Failed to save the sales KPI template.', severity: 'error' });
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
      transition: 'all 0.2s',
      '&:hover': { bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)' },
      '&.Mui-focused': { bgcolor: 'transparent' },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff',
          backgroundImage: 'none',
          boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0,0,0,0.1)',
          overflowX: 'hidden',
        },
      }}
      slotProps={{ backdrop: { sx: { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)' } } }}
    >
      <DialogTitle sx={{ fontWeight: 800, pr: 5, pb: 2, pt: 3, display: 'flex', alignItems: 'center', color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em' }}>
        {template ? (
          <EditNoteIcon sx={{ mr: 1.5, color: tokens.brand.accent, fontSize: 26 }} />
        ) : (
          <AddCircleOutlineIcon sx={{ mr: 1.5, color: tokens.brand.primary, fontSize: 26 }} />
        )}
        {template ? 'Edit Sales KPI Template' : 'Create Sales KPI Template'}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '8px !important', overflowX: 'hidden' }}>
        <TextField label="Template name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required sx={textFieldStyle} />
        <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} sx={textFieldStyle} />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: 1.5, borderRadius: '12px', bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.1)' : 'rgba(93, 26, 137, 0.05)' }}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: tokens.brand.primary, mt: 0.1 }} />
          <Typography variant="caption" sx={{ color: tokens.brand.primary, fontWeight: 600 }}>
            Tasks are generated automatically on each selected weekday and progress themselves from pipeline activity. Only New Prospects takes a manual target — the other metrics snapshot their target from the pipeline at generation time.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item, index) => {
            const manual = isManualTarget(item.targetMode);
            return (
              <Box
                key={item.key}
                sx={{
                  p: 2,
                  borderRadius: '20px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Item {index + 1}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  {items.length > 1 && (
                    <IconButton size="small" onClick={() => removeItem(index)} sx={{ color: tokens.semantic.error, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Task name"
                    value={item.name}
                    onChange={(e) => patchItem(index, { name: e.target.value })}
                    required
                    size="small"
                    sx={{ flex: 2, minWidth: 200, ...textFieldStyle }}
                  />
                  <TextField
                    select
                    label="Metric"
                    value={item.metric}
                    onChange={(e) => changeMetric(index, e.target.value as SalesKpiMetric)}
                    size="small"
                    sx={{ flex: 1, minWidth: 160, ...textFieldStyle }}
                  >
                    {SALES_KPI_METRIC_OPTIONS.map((m) => (
                      <MenuItem key={m} value={m}>{SALES_KPI_METRIC_LABELS[m]}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Priority"
                    value={item.priority}
                    onChange={(e) => patchItem(index, { priority: e.target.value as KpiPriority })}
                    size="small"
                    sx={{ flex: 1, minWidth: 120, ...textFieldStyle }}
                  >
                    {KPI_PRIORITY_OPTIONS.map((p) => (
                      <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
                    ))}
                  </TextField>
                  {manual && (
                    <TextField
                      label="Target"
                      type="number"
                      value={item.targetValue}
                      onChange={(e) => patchItem(index, { targetValue: e.target.value })}
                      required
                      error={invalidTarget(item)}
                      size="small"
                      inputProps={{ min: 0 }}
                      sx={{ flex: 1, minWidth: 110, ...textFieldStyle }}
                    />
                  )}
                </Box>

                <TextField
                  label="Description (optional)"
                  value={item.description}
                  onChange={(e) => patchItem(index, { description: e.target.value })}
                  size="small"
                  fullWidth
                  sx={textFieldStyle}
                />

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <WeekdayPicker
                    label="Runs on"
                    value={item.daysOfWeek}
                    onChange={(daysOfWeek) => patchItem(index, { daysOfWeek })}
                  />
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: tokens.text.muted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Schedule
                    </Typography>
                    <ToggleButtonGroup
                      value={item.scheduleMode}
                      exclusive
                      size="small"
                      onChange={(_, value) => value && patchItem(index, { scheduleMode: value as SalesKpiScheduleMode })}
                      sx={{
                        bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
                        p: 0.5,
                        borderRadius: '14px',
                        '& .MuiToggleButtonGroup-grouped': { border: 0, borderRadius: '10px !important', px: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' },
                      }}
                    >
                      <ToggleButton value="per_day" sx={{ color: 'text.secondary', '&.Mui-selected': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff', color: tokens.brand.primary } }}>
                        One task per day
                      </ToggleButton>
                      <ToggleButton value="span" sx={{ color: 'text.secondary', '&.Mui-selected': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff', color: tokens.brand.primary } }}>
                        Single task across days
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <TextField
                    label="Start time (optional)"
                    type="time"
                    value={item.startTime}
                    onChange={(e) => patchItem(index, { startTime: e.target.value })}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 60 }}
                    sx={{ width: 180, ...textFieldStyle }}
                    helperText="Empty = start of day"
                  />
                  <TextField
                    label="End time (optional)"
                    type="time"
                    value={item.endTime}
                    onChange={(e) => patchItem(index, { endTime: e.target.value })}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 60 }}
                    error={invalidTimeWindow(item)}
                    sx={{ width: 180, ...textFieldStyle }}
                    helperText={invalidTimeWindow(item) ? 'Must be after start time' : 'Empty = end of day'}
                  />
                </Box>

                {item.daysOfWeek.length === 0 && (
                  <Typography variant="caption" sx={{ color: tokens.semantic.error, fontWeight: 700 }}>
                    Select at least one weekday.
                  </Typography>
                )}

                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {manual
                    ? 'Target is set manually here.'
                    : 'Target is snapshotted from the pipeline when the task is generated.'}
                  {item.scheduleMode === 'span'
                    ? ' One task is created on the first selected weekday and is due at the end of the last selected weekday.'
                    : ' A separate task is created on each selected weekday.'}
                  {' '}Leave start/end empty to keep the default window (generated at day start, due at midnight).
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Button
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setItems((prev) => [...prev, makeItem()])}
          sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: tokens.brand.primary }}
        >
          Add item
        </Button>

        {!isEditing && (
          <Box
            sx={{
              mt: 1,
              p: 2,
              borderRadius: '20px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAddAlt1Icon sx={{ fontSize: 20, color: tokens.brand.primary }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                Assign after creating
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Optional — pick users now, or leave empty and assign later from the template list.
            </Typography>
            <Autocomplete
              multiple
              options={assignableUsers}
              getOptionLabel={(u) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}
              value={assignUsers}
              onChange={(_, v) => setAssignUsers(v)}
              renderInput={(params) => (
                <TextField {...params} label="Assign to users" sx={textFieldStyle} />
              )}
              sx={{
                '& .MuiChip-root': {
                  borderRadius: '8px',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                },
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, pt: 1, gap: 1.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending || !canSave}
          sx={{
            textTransform: 'none',
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontWeight: 700,
            boxShadow: 'none',
            bgcolor: tokens.brand.primary,
            '&:hover': { bgcolor: tokens.brand.primary, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transform: 'translateY(-1px)' },
            transition: 'all 0.2s',
          }}
        >
          {isPending
            ? (assignMutation.isPending ? 'Assigning...' : 'Saving...')
            : (!isEditing && assignUsers.length > 0 ? 'Save & Assign' : 'Save Template')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
