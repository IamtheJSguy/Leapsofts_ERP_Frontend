import { Snackbar, Alert } from '@mui/material';
import { useUIStore } from '@/store/useUIStore';

export const ToastProvider = () => {
  const { toastQueue, removeToast } = useUIStore();
  const current = toastQueue[0];

  return (
    <Snackbar
      open={!!current}
      autoHideDuration={4000}
      onClose={() => current && removeToast(current.id)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {current ? (
        <Alert
          severity={current.severity}
          onClose={() => removeToast(current.id)}
          variant="filled"
        >
          {current.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
};
