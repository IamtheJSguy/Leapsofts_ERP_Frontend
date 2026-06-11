import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { tokens } from '@/styles/tokens';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDarkMode ? '#1c1825' : '#fff',
          backgroundImage: 'none',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : tokens.surface.border}`,
          p: 2,
        },
      }}
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          fontWeight: 800,
          color: isDarkMode ? '#fff' : tokens.text.primary,
          fontSize: '1.25rem',
          pb: 1,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
            fontSize: '0.94rem',
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ gap: 1, pt: 2, px: 3, pb: 1 }}>
        <Button
          onClick={onCancel}
          disabled={isPending}
          sx={{
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.86rem',
            px: 3,
            py: 1,
            borderRadius: '12px',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            },
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isPending}
          sx={{
            bgcolor: '#d95236',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.86rem',
            px: 4,
            py: 1,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(217, 82, 54, 0.2)',
            textTransform: 'none',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              bgcolor: '#c7452b',
              boxShadow: '0 6px 16px rgba(217, 82, 54, 0.3)',
            },
            '&:active': {
              transform: 'translateY(1px)',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(217, 82, 54, 0.3)',
              color: 'rgba(255, 255, 255, 0.5)',
            }
          }}
          startIcon={isPending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
