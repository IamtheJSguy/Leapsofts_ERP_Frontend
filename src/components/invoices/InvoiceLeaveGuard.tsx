import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useBlocker, useNavigate } from 'react-router-dom';
import { tokens } from '@/styles/tokens';

export function useInvoiceLeave(dirty: boolean, onSave: () => Promise<boolean>, saving?: boolean) {
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
    navigate('/invoices');
  };

  const stay = () => {
    setOpen(false);
    if (blocker.state === 'blocked') blocker.reset();
  };

  const leave = () => {
    allowLeave.current = true;
    setOpen(false);
    if (blocker.state === 'blocked') blocker.proceed();
    else navigate('/invoices');
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
    <Dialog open={open} onClose={stay} fullWidth maxWidth="xs">
      <DialogTitle>Unsaved changes</DialogTitle>
      <DialogContent>
        You changed this page. Save before going back, or leave without saving.
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={stay} sx={{ textTransform: 'none' }}>Stay</Button>
        <Button onClick={leave} color="inherit" sx={{ textTransform: 'none' }}>Go back without saving</Button>
        <Button
          onClick={saveAndLeave}
          variant="contained"
          disabled={saving}
          sx={{ textTransform: 'none', bgcolor: tokens.brand.primary, boxShadow: 'none' }}
        >
          Save and go back
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { backButton, dialog, requestLeave, allowNext };
}
