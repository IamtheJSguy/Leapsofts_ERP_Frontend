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
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useCreateKPI, useUpdateKPI } from '@/hooks/api/useKPIs';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { useUIStore } from '@/store/useUIStore';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import { PIPELINE_METRIC_LABELS, PIPELINE_METRIC_OPTIONS } from '@/lib/constants';
import type { KPI, KpiPriority, PipelineMetric, User } from '@/types';
import { tokens } from '@/styles/tokens';

interface Props {
  open: boolean;
  onClose: () => void;
  kpi?: KPI | null;
}

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
  const [pipelineMetric, setPipelineMetric] = useState<PipelineMetric | ''>('');
  const [priority, setPriority] = useState<KpiPriority>('medium');
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);

  useEffect(() => {
    if (kpi) {
      setName(kpi.name);
      setDescription(kpi.description ?? '');
      setTargetValue(kpi.targetValue != null ? String(kpi.targetValue) : '');
      setDueDate(kpi.dueDate ? kpi.dueDate.slice(0, 10) : '');
      setPipelineMetric(kpi.pipelineMetric ?? '');
      setPriority(kpi.priority ?? 'medium');
      const assigned = (kpi.assignedTo ?? [])
        .map((id) => (typeof id === 'string' ? assignableUsers.find((u) => u._id === id) : id))
        .filter(Boolean) as User[];
      setAssignedUsers(assigned);
    } else {
      setName('');
      setDescription('');
      setTargetValue('');
      setDueDate('');
      setPipelineMetric('');
      setPriority('medium');
      setAssignedUsers([]);
    }
  }, [kpi, open, assignableUsers]);

  const targetValueMissing = pipelineMetric !== '' && targetValue.trim() === '';

  const handleSave = async () => {
    if (targetValueMissing) {
      addToast({ message: 'A target value is required when linking to a pipeline metric.', severity: 'error' });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      targetValue: targetValue.trim() === '' ? undefined : Number(targetValue),
      dueDate: dueDate || undefined,
      pipelineMetric: pipelineMetric || undefined,
      priority,
      assignedTo: assignedUsers.map((u) => u._id),
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
          <TextField
            label="Due Date (optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1, minWidth: 140, ...textFieldStyle }}
          />
          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as KpiPriority)} sx={{ flex: 1, minWidth: 100, ...textFieldStyle }}>
            {KPI_PRIORITY_OPTIONS.map((p) => (
              <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField
          select
          label="Link to pipeline metric (optional)"
          value={pipelineMetric}
          onChange={(e) => setPipelineMetric(e.target.value as PipelineMetric | '')}
          fullWidth
          error={targetValueMissing}
          helperText={targetValueMissing ? 'A target value is required when linking to a pipeline metric.' : ' '}
          sx={textFieldStyle}
        >
          <MenuItem value="">None</MenuItem>
          {PIPELINE_METRIC_OPTIONS.map((m) => (
            <MenuItem key={m} value={m}>{PIPELINE_METRIC_LABELS[m]}</MenuItem>
          ))}
        </TextField>
        {pipelineMetric && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: 1.5, borderRadius: '12px', bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.1)' : 'rgba(93, 26, 137, 0.05)' }}>
            <InfoOutlinedIcon sx={{ fontSize: 18, color: tokens.brand.primary, mt: 0.1 }} />
            <Typography variant="caption" sx={{ color: tokens.brand.primary, fontWeight: 600 }}>
              This KPI's progress will auto-track from live pipeline data; you can still adjust manually.
            </Typography>
          </Box>
        )}
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
          disabled={isPending || !name.trim() || targetValueMissing} 
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
