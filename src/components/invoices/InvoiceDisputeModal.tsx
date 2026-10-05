import { useEffect, useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import { tokens } from '@/styles/tokens';

interface InvoiceDisputeModalProps {
  open: boolean;
  invoiceNumber?: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}

export const InvoiceDisputeModal = ({
  open,
  invoiceNumber,
  submitting = false,
  onClose,
  onConfirm,
}: InvoiceDisputeModalProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    await onConfirm(trimmed);
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '20px',
          bgcolor: isDarkMode ? 'rgba(24, 21, 30, 0.98)' : '#FFFFFF',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        },
      }}
    >
      <DialogTitle sx={{ pt: 2.75, px: 3, pb: 1 }}>
        <Typography sx={{ fontWeight: 850, fontSize: '1.12rem', letterSpacing: '-0.02em' }}>
          Mark invoice as disputed
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: '0.875rem', color: 'text.secondary', fontWeight: 500 }}>
          {invoiceNumber
            ? `Invoice ${invoiceNumber} will be locked and shown as disputed. Add a reason for your records.`
            : 'This invoice will be locked and shown as disputed. Add a reason for your records.'}
        </Typography>
      </DialogTitle>

      {/* pt must clear the outlined label notch (DialogTitle + DialogContent resets padding-top). */}
      <DialogContent sx={{ px: 3, pt: '22px !important', pb: 0.5, overflow: 'visible' }}>
        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={8}
          label="Dispute reason"
          placeholder="e.g. Client rejected line items, billing mismatch, payment withheld…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
          inputProps={{ maxLength: 2000 }}
          helperText={`${reason.trim().length}/2000 characters`}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: '14px' },
            '& .MuiInputLabel-root': { bgcolor: isDarkMode ? 'rgba(24, 21, 30, 0.98)' : '#FFFFFF', px: 0.5 },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pt: 1.5, pb: 2.75, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => void handleConfirm()}
          disabled={submitting || !reason.trim()}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <GavelIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: '12px',
            px: 2.5,
            bgcolor: isDarkMode ? '#D97706' : tokens.brand.primary,
            '&:hover': { bgcolor: isDarkMode ? '#B45309' : tokens.brand.primaryDark },
          }}
        >
          {submitting ? 'Saving…' : 'Confirm dispute'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
