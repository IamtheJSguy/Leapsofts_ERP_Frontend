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
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useCreateKPI, useUpdateKPI } from '@/hooks/api/useKPIs';
import { useUsers } from '@/hooks/api/useUsers';
import { useUIStore } from '@/store/useUIStore';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import type { KPI, KpiTimeframe, KpiPriority, User } from '@/types';
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
  const { data: users = [] } = useUsers();
  const createMutation = useCreateKPI();
  const updateMutation = useUpdateKPI();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('50');
  const [timeFrame, setTimeFrame] = useState<KpiTimeframe>('daily');
  const [priority, setPriority] = useState<KpiPriority>('medium');
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);

  useEffect(() => {
    if (kpi) {
      setName(kpi.name);
      setDescription(kpi.description ?? '');
      setTargetValue(String(kpi.targetValue));
      setTimeFrame(kpi.timeFrame);
      setPriority(kpi.priority ?? 'medium');
      const assigned = (kpi.assignedTo ?? [])
        .map((id) => (typeof id === 'string' ? users.find((u) => u._id === id) : id))
        .filter(Boolean) as User[];
      setAssignedUsers(assigned);
    } else {
      setName('');
      setDescription('');
      setTargetValue('50');
      setTimeFrame('daily');
      setPriority('medium');
      setAssignedUsers([]);
    }
  }, [kpi, open, users]);

  const handleSave = async () => {
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      targetValue: Number(targetValue),
      timeFrame,
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
          sx: { backdropFilter: 'blur(4px)', backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)' }
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
          <TextField label="Target" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} sx={{ flex: 1, minWidth: 100, ...textFieldStyle }} />
          <TextField select label="Timeframe" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value as KpiTimeframe)} sx={{ flex: 1, minWidth: 100, ...textFieldStyle }}>
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </TextField>
          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as KpiPriority)} sx={{ flex: 1, minWidth: 100, ...textFieldStyle }}>
            {KPI_PRIORITY_OPTIONS.map((p) => (
              <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
            ))}
          </TextField>
        </Box>
        <Autocomplete
          multiple
          options={users.filter((u) => u.role === 'user')}
          getOptionLabel={(u) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}
          value={assignedUsers}
          onChange={(_, v) => setAssignedUsers(v)}
          renderInput={(params) => <TextField {...params} label="Assign to users (empty = all users)" sx={textFieldStyle} />}
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
          disabled={isPending || !name.trim()} 
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
