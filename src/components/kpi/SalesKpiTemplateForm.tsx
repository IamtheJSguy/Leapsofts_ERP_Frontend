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
  useMediaQuery,
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
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { SALES_KPI_METRIC_LABELS, SALES_KPI_METRIC_OPTIONS } from '@/lib/constants';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import { defaultTargetModeForMetric, isManualTarget } from '@/lib/salesKpi';
import { useUIStore } from '@/store/useUIStore';
import { showApiError } from '@/utils/apiError';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const addToast = useUIStore((s) => s.addToast);
  const assignableUsers = useAssignableUsers();
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
    } catch (err) {
      showApiError(err);
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
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff',
          backgroundImage: 'none',
          boxShadow: isMobile ? 'none' : isDarkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0,0,0,0.1)',
          overflowX: 'hidden',
          ...(isMobile ? { display: 'flex', flexDirection: 'column', maxHeight: '100dvh' } : {}),
        },
      }}
      slotProps={{ backdrop: { sx: { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)' } } }}
    >
      <DialogTitle sx={{ fontWeight: 800, pr: 5, pb: 2, pt: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', flexShrink: 0, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em' }}>
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

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important', px: { xs: 2, sm: 3 }, flex: isMobile ? 1 : undefined, overflowY: 'auto', overflowX: 'hidden' }}>
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

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexWrap: 'wrap',
                  }}
                >
                  <TextField
                    label="Task name"
                    value={item.name}
                    onChange={(e) => patchItem(index, { name: e.target.value })}
                    required
                    size="small"
                    fullWidth={isMobile}
                    sx={{ flex: { sm: 2 }, minWidth: { sm: 200 }, ...textFieldStyle }}
                  />
                  <TextField
                    select
                    label="Metric"
                    value={item.metric}
                    onChange={(e) => changeMetric(index, e.target.value as SalesKpiMetric)}
                    size="small"
                    fullWidth={isMobile}
                    sx={{ flex: { sm: 1 }, minWidth: { sm: 160 }, ...textFieldStyle }}
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
                    fullWidth={isMobile}
                    sx={{ flex: { sm: 1 }, minWidth: { sm: 120 }, ...textFieldStyle }}
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
                      fullWidth={isMobile}
                      inputProps={{ min: 0 }}
                      sx={{ flex: { sm: 1 }, minWidth: { sm: 110 }, ...textFieldStyle }}
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

                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', alignItems: 'flex-start', width: '100%' }}>
                  <Box sx={{ width: '100%', minWidth: 0, flex: { sm: '1 1 auto' } }}>
                    <WeekdayPicker
                      size="small"
                      label="Runs on"
                      value={item.daysOfWeek}
                      onChange={(daysOfWeek) => patchItem(index, { daysOfWeek })}
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
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

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(2, minmax(0, 180px))' },
                    gap: 2,
                    width: '100%',
                    alignItems: 'flex-start',
                  }}
                >
                  <TextField
                    label={isMobile ? 'Start' : 'Start time (optional)'}
                    type="time"
                    value={item.startTime}
                    onChange={(e) => patchItem(index, { startTime: e.target.value })}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 60 }}
                    sx={textFieldStyle}
                    helperText={isMobile ? undefined : 'Empty = start of day'}
                  />
                  <TextField
                    label={isMobile ? 'End' : 'End time (optional)'}
                    type="time"
                    value={item.endTime}
                    onChange={(e) => patchItem(index, { endTime: e.target.value })}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 60 }}
                    error={invalidTimeWindow(item)}
                    sx={textFieldStyle}
                    helperText={invalidTimeWindow(item) ? 'Must be after start time' : isMobile ? undefined : 'Empty = end of day'}
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
                <TextField
                  {...params}
                  label={isMobile ? 'Assign users' : 'Assign to users'}
                  placeholder={isMobile ? 'Optional — assign later' : undefined}
                  sx={textFieldStyle}
                />
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

      <DialogActions
        sx={{
          px: { xs: 2, sm: 4 },
          pb: { xs: 3, sm: 4 },
          pt: 1,
          gap: 1.5,
          flexShrink: 0,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Button
          onClick={onClose}
          fullWidth={isMobile}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending || !canSave}
          fullWidth={isMobile}
          sx={{
            textTransform: 'none',
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontWeight: 700,
            boxShadow: 'none',
            bgcolor: tokens.brand.solid,
            '&:hover': { bgcolor: tokens.brand.solid, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transform: 'translateY(-1px)' },
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
