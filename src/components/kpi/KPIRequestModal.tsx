import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { kpiChangeRequestSchema } from '@/utils/validators';
import { useRequestKPIChange } from '@/hooks/api/useKPIs';
import { useUIStore } from '@/store/useUIStore';
import type { KPI } from '@/types';

interface KPIRequestModalProps {
  kpi: KPI | null;
  open: boolean;
  onClose: () => void;
}

export const KPIRequestModal = ({ kpi, open, onClose }: KPIRequestModalProps) => {
  const requestChange = useRequestKPIChange();
  const addToast = useUIStore((s) => s.addToast);
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(kpiChangeRequestSchema),
  });

  const onSubmit = (data: { proposedTarget: number; reason: string }) => {
    if (!kpi) return;
    requestChange.mutate(
      { id: kpi._id, data },
      {
        onSuccess: () => {
          addToast({ message: 'Change request submitted', severity: 'success' });
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Request KPI Change — {kpi?.name}</DialogTitle>
        <DialogContent>
          <TextField
            {...register('proposedTarget')}
            label="Proposed Target"
            type="number"
            fullWidth
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField {...register('reason')} label="Reason" multiline rows={3} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={requestChange.isPending}>
            {requestChange.isPending ? <CircularProgress size={20} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
