import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useBlocker, useNavigate } from 'react-router-dom';
import { tokens } from '@/styles/tokens';

export function useInvoiceLeave(dirty: boolean, onSave: () => Promise<boolean>, saving?: boolean, exitTo = '/invoices') {
  const navigate = useNavigate();
  const allowLeave = useRef(false);
  const blocker = useBlocker(() => dirty && !allowLeave.current);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (blocker.state === 'blocked') setOpen(true);
  }, [blocker.state]);

  useEffect(() => {
    if (dirty) allowLeave.current = false;
  }, [dirty]);

  const requestLeave = () => {
    if (dirty && !allowLeave.current) {
      setOpen(true);
      return;
    }
    navigate(exitTo);
  };

  const stay = () => {
    setOpen(false);
    if (blocker.state === 'blocked') blocker.reset();
  };

  const leave = () => {
    allowLeave.current = true;
    setOpen(false);
    if (blocker.state === 'blocked') blocker.proceed();
    else navigate(exitTo);
  };

  const allowNext = () => {
    allowLeave.current = true;
  };

  const saveAndLeave = async () => {
    const saved = await onSave();
    if (!saved) {
      stay();
      return;
    }
    leave();
  };

  const backButton = (
    <Button
      onClick={requestLeave}
      startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
      sx={{
        color: 'text.secondary',
        fontWeight: 700,
        fontSize: '0.85rem',
        mb: 1.5,
        px: 0,
        textTransform: 'none',
        '&:hover': { bgcolor: 'transparent', color: tokens.brand.primary },
      }}
    >
      Back
    </Button>
  );

  const dialog: ReactNode = (
    <Dialog
      open={open}
      onClose={stay}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: '24px' } }}
    >
      <DialogTitle sx={{ pt: 3, px: 3, pb: 1, fontWeight: 800 }}>Unsaved changes</DialogTitle>
      <DialogContent sx={{ px: 3, pb: 1 }}>
        You changed this page. Save before going back, or leave without saving.
      </DialogContent>
      <DialogActions sx={{ px: 3, pt: 1, pb: 3, flexDirection: 'column', alignItems: 'stretch', gap: 1.25 }}>
        <Button
          onClick={saveAndLeave}
          variant="contained"
          disabled={saving}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: '14px',
            py: 1.1,
            bgcolor: tokens.brand.primary,
            boxShadow: 'none',
            '&:hover': { bgcolor: tokens.brand.primaryDark },
          }}
        >
          {saving ? 'Saving...' : 'Save and go back'}
        </Button>
        <Button
          onClick={leave}
          variant="outlined"
          color="inherit"
          sx={{
            textTransform: 'none',
            fontWeight: 750,
            borderRadius: '14px',
            py: 1.1,
            borderColor: 'rgba(0,0,0,0.16)',
          }}
        >
          Go back without saving
        </Button>
        <Button
          onClick={stay}
          sx={{ textTransform: 'none', fontWeight: 750, borderRadius: '14px', py: 1, color: 'text.secondary' }}
        >
          Stay on this page
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { backButton, dialog, requestLeave, allowNext };
}
