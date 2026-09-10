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
import type { KpiPriority } from '@/types';
import { tokens } from '@/styles/tokens';

export type ChangeRequestModalMode =
  | {
      sourceType: 'assignment';
      type: 'modify' | 'add' | 'remove';
      assignmentId: string;
      assignmentItemId?: string;
      kpiName?: string;
      currentTargetValue?: number;
      currentDueDate?: string;
      currentPriority?: KpiPriority;
    }
  | {
      sourceType: 'standalone';
      type: 'modify';
      kpiId: string;
      kpiName: string;
      currentTargetValue?: number;
      currentDueDate?: string;
      currentPriority?: KpiPriority;
    }
  | {
      sourceType: 'sales';
      type?: 'modify';
      kpiId?: string;
      kpiName?: string;
      currentTargetValue?: number;
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

  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!mode) return;
    setReason('');
  }, [mode]);

  const handleSubmit = async () => {
    if (!mode || reason.trim().length < 10) {
      addToast({ message: 'Please provide a reason (min 10 characters).', severity: 'error' });
      return;
    }

    let payload: SubmitChangeRequestPayload;

    if (mode.sourceType === 'sales') {
      payload = {
        sourceType: 'sales',
        type: 'modify',
        kpiId: mode.kpiId,
        kpiName: mode.kpiName ?? 'Sales KPI Target',
        reason: reason.trim(),
      };
    } else if (mode.sourceType === 'assignment') {
      payload = {
        sourceType: 'assignment',
        type: mode.type,
        assignmentId: mode.assignmentId,
        assignmentItemId: mode.assignmentItemId,
        kpiName: mode.kpiName,
        reason: reason.trim(),
      };
    } else {
      payload = {
        sourceType: 'standalone',
        type: 'modify',
        kpiId: mode.kpiId,
        kpiName: mode.kpiName,
        reason: reason.trim(),
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

  const kpiNameDisplay = mode && 'kpiName' in mode && mode.kpiName ? mode.kpiName : 'KPI Target';
  const requestTypeLabel =
    mode?.sourceType === 'sales'
      ? 'Sales KPI'
      : mode?.sourceType === 'standalone'
        ? 'Standalone KPI'
        : 'KPI Template';

  const title = `Request Change: ${kpiNameDisplay}`;

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
        <EditNoteIcon sx={{ mr: 1.5, color: tokens.brand.accent, fontSize: 26 }} />
        {title}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '8px !important' }}>
        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.5 }}>
              Target KPI / Task
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
              {kpiNameDisplay}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 0.5 }}>
              Type
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: isDarkMode ? 'rgba(255,255,255,0.9)' : tokens.text.primary }}>
              {requestTypeLabel}
            </Typography>
          </Box>
        </Box>

        <TextField
          label="Reason for Request *"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          required
          multiline
          rows={4}
          placeholder="Explain why you are requesting a change to this KPI..."
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
            bgcolor: tokens.brand.primary,
            '&:hover': {
              bgcolor: tokens.brand.primary,
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
