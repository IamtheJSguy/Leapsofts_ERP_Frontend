import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  Box,
  IconButton,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { WeekdayPicker } from '@/components/kpi/WeekdayPicker';
import { useCreateKPI, useUpdateKPI } from '@/hooks/api/useKPIs';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { useUIStore } from '@/store/useUIStore';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import type { KPI, KpiPriority, KpiRecurrenceMode, KpiScheduleMode, User } from '@/types';
import { tokens } from '@/styles/tokens';

interface Props {
  open: boolean;
  onClose: () => void;
  kpi?: KPI | null;
}

/** Same-day windows require start before end when both times are set. */
const invalidTimeWindow = (
  scheduleMode: KpiScheduleMode,
  daysOfWeek: number[],
  startTime: string,
  endTime: string,
) => {
  if (!startTime || !endTime) return false;
  const sameDay = scheduleMode !== 'span' || daysOfWeek.length <= 1;
  return sameDay && startTime >= endTime;
};

export const StandaloneKPIForm = ({ open, onClose, kpi }: Props) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);
  const assignableUsers = useAssignableUsers();
  const createMutation = useCreateKPI();
  const updateMutation = useUpdateKPI();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<KpiPriority>('medium');
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [scheduleMode, setScheduleMode] = useState<KpiScheduleMode>('per_day');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurrenceMode, setRecurrenceMode] = useState<KpiRecurrenceMode>('weekly');

  useEffect(() => {
    if (kpi) {
      setName(kpi.name);
      setDescription(kpi.description ?? '');
      setTargetValue(kpi.targetValue != null ? String(kpi.targetValue) : '');
      setDueDate(kpi.dueDate ? kpi.dueDate.slice(0, 10) : '');
      setPriority(kpi.priority ?? 'medium');
      setDaysOfWeek(kpi.daysOfWeek ?? []);
      setScheduleMode(kpi.scheduleMode ?? 'per_day');
      setStartTime(kpi.startTime ?? '');
      setEndTime(kpi.endTime ?? '');
      setRecurrenceMode(kpi.recurrenceMode ?? 'weekly');
      const assigned = (kpi.assignedTo ?? [])
        .map((id) => (typeof id === 'string' ? assignableUsers.find((u) => u._id === id) : id))
        .filter(Boolean) as User[];
      setAssignedUsers(assigned);
    } else {
      setName('');
      setDescription('');
      setTargetValue('');
      setDueDate('');
      setPriority('medium');
      setAssignedUsers([]);
      setDaysOfWeek([]);
      setScheduleMode('per_day');
      setStartTime('');
      setEndTime('');
      setRecurrenceMode('weekly');
    }
  }, [kpi, open, assignableUsers]);

  const hasSchedule = daysOfWeek.length > 0;
  const timeInvalid = hasSchedule && invalidTimeWindow(scheduleMode, daysOfWeek, startTime, endTime);

  const handleDaysChange = (days: number[]) => {
    setDaysOfWeek(days);
    if (days.length > 0) setDueDate('');
  };

  const handleSave = async () => {
    if (timeInvalid) {
      addToast({ message: 'End time must be after start time for same-day schedules.', severity: 'error' });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      targetValue: targetValue.trim() === '' ? undefined : Number(targetValue),
      priority,
      assignedTo: assignedUsers.map((u) => u._id),
      ...(hasSchedule
        ? {
            dueDate: undefined,
            daysOfWeek: [...daysOfWeek].sort((a, b) => a - b),
            scheduleMode,
            startTime: startTime || null,
            endTime: endTime || null,
            recurrenceMode,
          }
        : {
            dueDate: dueDate || undefined,
            daysOfWeek: [] as number[],
            scheduleMode: undefined,
            startTime: null,
            endTime: null,
            recurrenceMode: undefined,
          }),
    };

    try {
      if (kpi) {
        await updateMutation.mutateAsync({ id: kpi._id, data: payload });
        addToast({ message: 'KPI updated.', severity: 'success' });
      } else {
        await createMutation.mutateAsync(payload);
        addToast({ message: 'KPI created.', severity: 'success' });
      }
      onClose();
    } catch {
      addToast({ message: 'Failed to save KPI.', severity: 'error' });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const headerIcon = kpi ? <EditNoteIcon sx={{ mr: 1.5, color: tokens.brand.accent, fontSize: 26 }} /> : <AddCircleOutlineIcon sx={{ mr: 1.5, color: tokens.brand.primary, fontSize: 26 }} />;

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
      transition: 'all 0.2s',
      '&:hover': {
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
      },
      '&.Mui-focused': {
        bgcolor: 'transparent',
      }
    }
  };

  const toggleGroupSx = {
    bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
    p: 0.5,
    borderRadius: '14px',
    '& .MuiToggleButtonGroup-grouped': { border: 0, borderRadius: '10px !important', px: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' },
  };

  const toggleSelectedSx = { color: 'text.secondary', '&.Mui-selected': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff', color: tokens.brand.primary } };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      PaperProps={{ 
        sx: { 
          borderRadius: '24px', 
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff',
          backgroundImage: 'none',
          boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0,0,0,0.1)',
          overflowX: 'hidden',
        } 
      }}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)' }
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pr: 5, pb: 2, pt: 3, display: 'flex', alignItems: 'center', color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em' }}>
        {headerIcon}
        {kpi ? 'Edit Standalone KPI' : 'Create Standalone KPI'}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '8px !important', overflowX: 'hidden' }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required sx={textFieldStyle} />
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} sx={textFieldStyle} />
        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
          <TextField
            label="Target (optional)"
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="Leave blank for a simple task"
            sx={{ flex: 1, minWidth: 100, ...textFieldStyle }}
          />
          {!hasSchedule && (
            <TextField
              label="Due Date (optional)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 140, ...textFieldStyle }}
            />
          )}
          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as KpiPriority)} sx={{ flex: 1, minWidth: 100, ...textFieldStyle }}>
            {KPI_PRIORITY_OPTIONS.map((p) => (
              <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Box
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
          <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Schedule
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <WeekdayPicker
              label="Runs on"
              value={daysOfWeek}
              onChange={handleDaysChange}
            />
            {hasSchedule && (
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: tokens.text.muted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Schedule
                </Typography>
                <ToggleButtonGroup
                  value={scheduleMode}
                  exclusive
                  size="small"
                  onChange={(_, value) => value && setScheduleMode(value as KpiScheduleMode)}
                  sx={toggleGroupSx}
                >
                  <ToggleButton value="per_day" sx={toggleSelectedSx}>
                    One task per day
                  </ToggleButton>
                  <ToggleButton value="span" sx={toggleSelectedSx}>
                    Single task across days
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
          </Box>

          {hasSchedule && (
            <>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: tokens.text.muted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Repeat
                </Typography>
                <ToggleButtonGroup
                  value={recurrenceMode}
                  exclusive
                  size="small"
                  onChange={(_, value) => value && setRecurrenceMode(value as KpiRecurrenceMode)}
                  sx={toggleGroupSx}
                >
                  <ToggleButton value="weekly" sx={toggleSelectedSx}>
                    Repeats weekly
                  </ToggleButton>
                  <ToggleButton value="once" sx={toggleSelectedSx}>
                    This week only
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <TextField
                  label="Start time (optional)"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 60 }}
                  sx={{ width: 180, ...textFieldStyle }}
                  helperText="Empty = start of day"
                />
                <TextField
                  label="End time (optional)"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 60 }}
                  error={timeInvalid}
                  sx={{ width: 180, ...textFieldStyle }}
                  helperText={timeInvalid ? 'Must be after start time' : 'Empty = end of day'}
                />
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {scheduleMode === 'span'
                  ? ' One task is created on the first selected weekday and is due at the end of the last selected weekday.'
                  : ' A separate task is created on each selected weekday.'}
                {recurrenceMode === 'weekly'
                  ? ' Entries keep generating every week while this KPI is active.'
                  : ' Entries generate only for the week this KPI was created.'}
                {' '}Leave start/end empty to keep the default window (generated at day start, due at midnight).
              </Typography>
            </>
          )}

          {!hasSchedule && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Select weekdays to schedule recurring or this-week tasks. Leave empty to use an optional due date instead.
            </Typography>
          )}
        </Box>

        <Autocomplete
          multiple
          options={assignableUsers}
          getOptionLabel={(u) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}
          value={assignedUsers}
          onChange={(_, v) => setAssignedUsers(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Assign to team members (empty = all eligible users)"
              sx={textFieldStyle}
            />
          )}
          sx={{
            '& .MuiChip-root': { borderRadius: '8px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 4, pt: 1, gap: 1.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={isPending || !name.trim() || timeInvalid} 
          sx={{ 
            textTransform: 'none', 
            borderRadius: '12px', 
            px: 3, 
            py: 1.25, 
            fontWeight: 700, 
            boxShadow: 'none',
            bgcolor: tokens.brand.primary,
            '&:hover': {
              bgcolor: tokens.brand.primary,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s'
          }}
        >
          {isPending ? 'Saving...' : 'Save KPI'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
