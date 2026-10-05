import { useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { InvoiceTemplatePreview, type InvoicePreviewData } from '@/components/invoices/InvoiceTemplatePreview';
import { tokens } from '@/styles/tokens';

interface InvoiceSendConfirmModalProps {
  open: boolean;
  data: InvoicePreviewData | null;
  clientEmail?: string;
  submitting?: boolean;
  confirmLabel?: string;
  title?: string;
  onClose: () => void;
  onConfirm: (previewElement: HTMLElement) => void | Promise<void>;
}

export const InvoiceSendConfirmModal = ({
  open,
  data,
  clientEmail,
  submitting = false,
  confirmLabel = 'Confirm & Send',
  title = 'Confirm invoice email',
  onClose,
  onConfirm,
}: InvoiceSendConfirmModalProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const previewRef = useRef<HTMLDivElement>(null);

  const handleConfirm = async () => {
    if (!previewRef.current) return;
    await onConfirm(previewRef.current);
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: '20px',
          bgcolor: isDarkMode ? 'rgba(24, 21, 30, 0.98)' : '#F8F7FA',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          maxHeight: '92vh',
        },
      }}
    >
      <DialogTitle sx={{ pt: 2.75, px: 3, pb: 1 }}>
        <Typography sx={{ fontWeight: 850, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: '0.875rem', color: 'text.secondary', fontWeight: 500 }}>
          Review the invoice below before sending
          {clientEmail ? (
            <>
              {' '}to <Box component="span" sx={{ fontWeight: 750, color: 'text.primary' }}>{clientEmail}</Box>
            </>
          ) : null}
          {data?.invoiceNumber ? (
            <>
              {' '}· <Box component="span" sx={{ fontWeight: 700 }}>{data.invoiceNumber}</Box>
            </>
          ) : null}
          .
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
        <Box
          sx={{
            borderRadius: '14px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)',
            p: { xs: 1, sm: 1.5 },
            maxHeight: 'min(62vh, 720px)',
            overflow: 'auto',
          }}
        >
          {data ? (
            <Box
              sx={{
                mx: 'auto',
                width: '100%',
                maxWidth: 720,
                boxShadow: isDarkMode ? 'none' : '0 8px 28px rgba(26, 22, 37, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
                bgcolor: '#fff',
              }}
            >
              <Box ref={previewRef} sx={{ background: '#FFFFFF' }}>
                <InvoiceTemplatePreview data={data} />
              </Box>
            </Box>
          ) : (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={28} sx={{ color: tokens.brand.primary }} />
            </Box>
          )}
        </Box>
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
          onClick={() => void handleConfirm()}
          disabled={submitting || !data}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: '12px',
            px: 2.5,
            bgcolor: tokens.brand.primary,
            '&:hover': { bgcolor: tokens.brand.primaryDark },
          }}
        >
          {submitting ? 'Sending…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
