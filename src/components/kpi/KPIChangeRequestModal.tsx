import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSubmitKPIChangeRequest, type SubmitChangeRequestPayload } from '@/hooks/api/useKPIChangeRequests';
import { useUIStore } from '@/store/useUIStore';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import type { KpiTimeframe, KpiPriority } from '@/types';

export type ChangeRequestModalMode =
  | {
      sourceType: 'assignment';
      type: 'modify';
      assignmentId: string;
      assignmentItemId: string;
      kpiName: string;
      currentTargetValue: number;
      currentTimeFrame: KpiTimeframe;
      currentPriority?: KpiPriority;
    }
  | { sourceType: 'assignment'; type: 'add'; assignmentId: string }
  | {
      sourceType: 'assignment';
      type: 'remove';
      assignmentId: string;
      assignmentItemId: string;
      kpiName: string;
    }
  | {
      sourceType: 'standalone';
      type: 'modify';
      kpiId: string;
      kpiName: string;
      currentTargetValue: number;
      currentTimeFrame: KpiTimeframe;
      currentPriority?: KpiPriority;
    };

interface Props {
  open: boolean;
  mode: ChangeRequestModalMode | null;
  onClose: () => void;
}

export const KPIChangeRequestModal = ({ open, mode, onClose }: Props) => {
  const addToast = useUIStore((s) => s.addToast);
  const submitMutation = useSubmitKPIChangeRequest();

  const [targetValue, setTargetValue] = useState('');
  const [timeFrame, setTimeFrame] = useState<KpiTimeframe>('daily');
  const [priority, setPriority] = useState<KpiPriority>('medium');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!mode) return;
    if (mode.type === 'modify') {
      setTargetValue(String(mode.currentTargetValue));
      setTimeFrame(mode.currentTimeFrame);
      setPriority(mode.currentPriority ?? 'medium');
    } else if (mode.type === 'add') {
      setName('');
      setDescription('');
      setTargetValue('50');
      setTimeFrame('daily');
      setPriority('medium');
    }
    setReason('');
  }, [mode]);

  const handleSubmit = async () => {
    if (!mode || reason.trim().length < 10) {
      addToast({ message: 'Please provide a reason (min 10 characters).', severity: 'error' });
      return;
    }

    let payload: SubmitChangeRequestPayload;

    if (mode.sourceType === 'assignment' && mode.type === 'modify') {
      payload = {
        sourceType: 'assignment',
        type: 'modify',
        assignmentId: mode.assignmentId,
        assignmentItemId: mode.assignmentItemId,
        reason: reason.trim(),
        requestedTargetValue: Number(targetValue) !== mode.currentTargetValue ? Number(targetValue) : undefined,
        requestedTimeFrame: timeFrame !== mode.currentTimeFrame ? timeFrame : undefined,
        requestedPriority: priority !== (mode.currentPriority ?? 'medium') ? priority : undefined,
      };
    } else if (mode.sourceType === 'assignment' && mode.type === 'add') {
      payload = {
        sourceType: 'assignment',
        type: 'add',
        assignmentId: mode.assignmentId,
        reason: reason.trim(),
        proposedItem: {
          name: name.trim(),
          description: description.trim() || undefined,
          targetValue: Number(targetValue),
          timeFrame,
          priority,
        },
      };
    } else if (mode.sourceType === 'assignment' && mode.type === 'remove') {
      payload = {
        sourceType: 'assignment',
        type: 'remove',
        assignmentId: mode.assignmentId,
        assignmentItemId: mode.assignmentItemId,
        reason: reason.trim(),
      };
    } else {
      payload = {
        sourceType: 'standalone',
        type: 'modify',
        kpiId: mode.kpiId,
        reason: reason.trim(),
        requestedTargetValue: Number(targetValue) !== mode.currentTargetValue ? Number(targetValue) : undefined,
        requestedTimeFrame: timeFrame !== mode.currentTimeFrame ? timeFrame : undefined,
        requestedPriority: priority !== (mode.currentPriority ?? 'medium') ? priority : undefined,
      };
    }

    try {
      await submitMutation.mutateAsync(payload);
      addToast({ message: 'Change request submitted for admin review.', severity: 'success' });
      onClose();
    } catch {
      addToast({ message: 'Failed to submit change request.', severity: 'error' });
    }
  };

  const title =
    mode?.type === 'add'
      ? 'Request Add KPI'
      : mode?.type === 'remove'
        ? `Request Remove: ${mode.kpiName}`
        : `Request Change: ${mode && 'kpiName' in mode ? mode.kpiName : 'KPI'}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
      <DialogTitle sx={{ fontWeight: 800, pr: 5 }}>
        {title}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        {mode?.type === 'remove' && (
          <Typography variant="body2" color="text.secondary">
            This will request removal of &quot;{mode.kpiName}&quot; from your assignment after admin approval.
          </Typography>
        )}

        {mode?.type === 'add' && (
          <>
            <TextField label="KPI Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
          </>
        )}

        {(mode?.type === 'modify' || mode?.type === 'add') && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Target Value"
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField select label="Timeframe" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value as KpiTimeframe)} sx={{ flex: 1, minWidth: 120 }}>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </TextField>
            <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as KpiPriority)} sx={{ flex: 1, minWidth: 120 }}>
              {KPI_PRIORITY_OPTIONS.map((p) => (
                <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        <TextField
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          required
          multiline
          rows={3}
          helperText="Minimum 10 characters"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          sx={{ textTransform: 'none', borderRadius: '12px' }}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
