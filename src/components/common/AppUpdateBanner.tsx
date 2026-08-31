import { Button, Snackbar, Alert } from '@mui/material';
import { useAppVersionCheck } from '@/hooks/useAppVersionCheck';

export const AppUpdateBanner = () => {
  const updateAvailable = useAppVersionCheck();

  return (
    <Snackbar
      open={updateAvailable}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="info"
        variant="filled"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        }
      >
        A new version is available.
      </Alert>
    </Snackbar>
  );
};
