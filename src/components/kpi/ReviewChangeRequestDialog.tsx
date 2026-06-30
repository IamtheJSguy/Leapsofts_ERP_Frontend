import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
} from '@mui/material';
import { useReviewKPIChangeRequest } from '@/hooks/api/useKPIChangeRequests';
import { useUIStore } from '@/store/useUIStore';
import { PriorityBadge } from '@/components/kpi/PriorityBadge';
import type { KPIChangeRequest, User } from '@/types';

interface Props {
  request: KPIChangeRequest | null;
  open: boolean;
  onClose: () => void;
}

const formatUser = (u: string | User | undefined) => {
  if (!u || typeof u === 'string') return 'User';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
};

const diffLine = (label: string, current?: string | number, requested?: string | number) => {
  if (requested === undefined || requested === current) return null;
  return (
    <Typography variant="body2" key={label}>
      <strong>{label}:</strong> {current ?? '—'} → {requested}
    </Typography>
  );
};

export const ReviewChangeRequestDialog = ({ request, open, onClose }: Props) => {
  const addToast = useUIStore((s) => s.addToast);
  const reviewMutation = useReviewKPIChangeRequest();
  const [effectiveWhen, setEffectiveWhen] = useState<'immediate' | 'next_day'>('immediate');
  const [adminNote, setAdminNote] = useState('');

  const handleReview = async (approved: boolean) => {
    if (!request) return;
    try {
      await reviewMutation.mutateAsync({
        requestId: request._id,
        approved,
        effectiveWhen: approved ? effectiveWhen : undefined,
        adminNote: adminNote.trim() || undefined,
      });
      addToast({ message: approved ? 'Change request approved.' : 'Change request rejected.', severity: 'success' });
      onClose();
      setAdminNote('');
    } catch {
      addToast({ message: 'Failed to review change request.', severity: 'error' });
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Review Change Request</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={request.sourceType === 'assignment' ? 'Assignment' : 'Standalone'} size="small" />
          <Chip label={request.type} size="small" color="primary" variant="outlined" />
        </Box>
        <Typography variant="body2"><strong>User:</strong> {formatUser(request.userId)}</Typography>
        <Typography variant="body2"><strong>KPI:</strong> {request.kpiName ?? '—'}</Typography>
        <Typography variant="body2"><strong>Reason:</strong> {request.reason}</Typography>

        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
          {diffLine('Target', request.currentTargetValue, request.requestedTargetValue)}
          {diffLine('Timeframe', request.currentTimeFrame, request.requestedTimeFrame)}
          {(request.requestedPriority && request.requestedPriority !== request.currentPriority) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="body2"><strong>Priority:</strong></Typography>
              <PriorityBadge priority={request.currentPriority} />
              <Typography variant="body2">→</Typography>
              <PriorityBadge priority={request.requestedPriority} />
            </Box>
          )}
          {request.proposedItem && (
            <Typography variant="body2">
              <strong>New item:</strong> {request.proposedItem.name} — target {request.proposedItem.targetValue} ({request.proposedItem.timeFrame})
            </Typography>
          )}
        </Box>

        <RadioGroup value={effectiveWhen} onChange={(e) => setEffectiveWhen(e.target.value as 'immediate' | 'next_day')}>
          <FormControlLabel value="immediate" control={<Radio />} label="Apply immediately" />
          <FormControlLabel value="next_day" control={<Radio />} label="Apply from tomorrow" />
        </RadioGroup>

        <TextField label="Admin note (optional)" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} fullWidth multiline rows={2} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button color="error" onClick={() => handleReview(false)} disabled={reviewMutation.isPending} sx={{ textTransform: 'none' }}>
          Reject
        </Button>
        <Button variant="contained" onClick={() => handleReview(true)} disabled={reviewMutation.isPending} sx={{ textTransform: 'none', borderRadius: '12px' }}>
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};
