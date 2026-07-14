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
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useSubmitKPIChangeRequest, type SubmitChangeRequestPayload } from '@/hooks/api/useKPIChangeRequests';
import { useUIStore } from '@/store/useUIStore';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import type { KpiTimeframe, KpiPriority } from '@/types';
import { tokens } from '@/styles/tokens';

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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
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

  const headerIcon = mode?.type === 'add' ? <AddCircleOutlineIcon sx={{ mr: 1.5, color: tokens.brand.primary, fontSize: 26 }} /> : mode?.type === 'remove' ? <RemoveCircleOutlineIcon sx={{ mr: 1.5, color: tokens.semantic.error, fontSize: 26 }} /> : <EditNoteIcon sx={{ mr: 1.5, color: tokens.brand.accent, fontSize: 26 }} />;

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
        {title}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '8px !important' }}>
        {mode?.type === 'remove' && (
          <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, p: 2, bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'}` }}>
            This will request removal of <strong>&quot;{mode.kpiName}&quot;</strong> from your assignment after admin approval.
          </Typography>
        )}

        {mode?.type === 'add' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="KPI Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required sx={textFieldStyle} />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} sx={textFieldStyle} />
          </Box>
        )}

        {(mode?.type === 'modify' || mode?.type === 'add') && (
          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
            <TextField
              label="Target Value"
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              sx={{ flex: 1, minWidth: 120, ...textFieldStyle }}
            />
            <TextField select label="Timeframe" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value as KpiTimeframe)} sx={{ flex: 1, minWidth: 120, ...textFieldStyle }}>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </TextField>
            <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as KpiPriority)} sx={{ flex: 1, minWidth: 120, ...textFieldStyle }}>
              {KPI_PRIORITY_OPTIONS.map((p) => (
                <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        <TextField
          label="Reason for Request *"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          required
          multiline
          rows={3}
          helperText="Minimum 10 characters to explain your request"
          sx={textFieldStyle}
        />
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 4, pt: 1, gap: 1.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          sx={{ 
            textTransform: 'none', 
            borderRadius: '12px', 
            px: 3, 
            py: 1.25, 
            fontWeight: 700, 
            boxShadow: 'none',
            bgcolor: mode?.type === 'remove' ? tokens.semantic.error : tokens.brand.primary,
            '&:hover': {
              bgcolor: mode?.type === 'remove' ? tokens.semantic.error : tokens.brand.primary,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s'
          }}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
