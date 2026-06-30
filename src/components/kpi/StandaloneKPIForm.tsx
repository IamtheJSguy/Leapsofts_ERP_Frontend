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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateKPI, useUpdateKPI } from '@/hooks/api/useKPIs';
import { useUsers } from '@/hooks/api/useUsers';
import { useUIStore } from '@/store/useUIStore';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import type { KPI, KpiTimeframe, KpiPriority, User } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  kpi?: KPI | null;
}

export const StandaloneKPIForm = ({ open, onClose, kpi }: Props) => {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
      <DialogTitle sx={{ fontWeight: 800, pr: 5 }}>
        {kpi ? 'Edit Standalone KPI' : 'Create Standalone KPI'}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField label="Target" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} sx={{ flex: 1 }} />
          <TextField select label="Timeframe" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value as KpiTimeframe)} sx={{ flex: 1 }}>
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </TextField>
          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as KpiPriority)} sx={{ flex: 1 }}>
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
          renderInput={(params) => <TextField {...params} label="Assign to users (empty = all users)" />}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={isPending || !name.trim()} sx={{ textTransform: 'none', borderRadius: '12px' }}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
