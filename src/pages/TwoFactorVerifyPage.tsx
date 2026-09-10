import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Link,
  useTheme,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useTwoFactorVerifyLogin } from '@/hooks/api/useTwoFactor';
import { tokens } from '@/styles/tokens';
import { APP_NAME } from '@/lib/constants';

const TEMP_TOKEN_KEY = '2faTempToken';

const TwoFactorVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  const verifyLogin = useTwoFactorVerifyLogin();

  const tempToken =
    (location.state as { tempToken?: string } | null)?.tempToken ||
    sessionStorage.getItem(TEMP_TOKEN_KEY) ||
    '';

  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);

  useEffect(() => {
    if (!tempToken) navigate('/login', { replace: true });
  }, [tempToken, navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyLogin.mutate(
      { tempToken, code: code.trim() },
      {
        onSuccess: (data) => {
          sessionStorage.removeItem(TEMP_TOKEN_KEY);
          localStorage.setItem('accessToken', data.accessToken);
          setAuth(data.user as Parameters<typeof setAuth>[0]);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          navigate('/', { replace: true });
        },
      },
    );
  };

  const errorMessage =
    (verifyLogin.error as { response?: { data?: { error?: { message?: string } } } } | null)?.response
      ?.data?.error?.message || (verifyLogin.isError ? 'Verification failed' : '');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: isDarkMode ? '#0d0b11' : tokens.surface.main,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          width: '100%',
          maxWidth: 430,
          borderRadius: 6,
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : 'rgba(255, 255, 255, 0.65)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.4)'}`,
          boxShadow: isDarkMode ? '0 24px 64px rgba(0, 0, 0, 0.35)' : tokens.shadow.card,
        }}
      >
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
          {APP_NAME}
        </Typography>
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{ letterSpacing: '-0.03em', mb: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}
        >
          Two-factor authentication
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          {useBackup
            ? 'Enter one of your unused backup codes.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit}>
          <TextField
            autoFocus
            fullWidth
            label={useBackup ? 'Backup code' : 'Authenticator code'}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            inputProps={{
              inputMode: useBackup ? 'text' : 'numeric',
              autoComplete: 'one-time-code',
              maxLength: useBackup ? 16 : 6,
            }}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={verifyLogin.isPending || code.trim().length < 6}
            sx={{
              py: 1.4,
              borderRadius: tokens.radius.pill,
              fontWeight: 600,
              background: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.primaryLight})`,
            }}
          >
            {verifyLogin.isPending ? <CircularProgress size={22} color="inherit" /> : 'Verify'}
          </Button>
        </Box>

        <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'space-between' }}>
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => {
              setUseBackup((v) => !v);
              setCode('');
            }}
            sx={{ fontSize: '0.85rem', color: tokens.brand.primaryMuted }}
          >
            {useBackup ? 'Use authenticator code' : 'Use backup code instead'}
          </Link>
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => {
              sessionStorage.removeItem(TEMP_TOKEN_KEY);
              navigate('/login');
            }}
            sx={{ fontSize: '0.85rem', color: 'text.secondary' }}
          >
            Back to login
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default TwoFactorVerifyPage;
