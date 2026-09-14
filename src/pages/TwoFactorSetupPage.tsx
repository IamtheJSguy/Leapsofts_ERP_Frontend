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
  Checkbox,
  FormControlLabel,
  IconButton,
  Link,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useTwoFactorSetup, useTwoFactorVerifySetup } from '@/hooks/api/useTwoFactor';
import { tokens } from '@/styles/tokens';
import { APP_NAME } from '@/lib/constants';
import { useUIStore } from '@/store/useUIStore';

const TEMP_TOKEN_KEY = '2faTempToken';

const TwoFactorSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const verifySetup = useTwoFactorVerifySetup();

  const tempToken =
    (location.state as { tempToken?: string } | null)?.tempToken ||
    sessionStorage.getItem(TEMP_TOKEN_KEY) ||
    '';

  const setup = useTwoFactorSetup(tempToken || undefined);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [pendingSession, setPendingSession] = useState<{
    accessToken: string;
    user: Parameters<typeof setAuth>[0];
  } | null>(null);

  useEffect(() => {
    if (!tempToken) navigate('/login', { replace: true });
  }, [tempToken, navigate]);

  const activeStep = backupCodes ? 2 : 0;

  const onVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifySetup.mutate(
      { tempToken, code: code.trim() },
      {
        onSuccess: (data) => {
          setBackupCodes(data.backupCodes ?? []);
          setPendingSession({
            accessToken: data.accessToken,
            user: data.user as Parameters<typeof setAuth>[0],
          });
        },
      },
    );
  };

  const finish = () => {
    if (!pendingSession) return;
    sessionStorage.removeItem(TEMP_TOKEN_KEY);
    localStorage.setItem('accessToken', pendingSession.accessToken);
    setAuth(pendingSession.user);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    navigate('/', { replace: true });
  };

  const copySecret = async () => {
    if (!setup.data?.secret) return;
    await navigator.clipboard.writeText(setup.data.secret);
    addToast({ message: 'Secret key copied', severity: 'success' });
  };

  const copyBackupCodes = async () => {
    if (!backupCodes) return;
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    addToast({ message: 'Backup codes copied', severity: 'success' });
  };

  const errorMessage =
    (verifySetup.error as { response?: { data?: { error?: { message?: string } } } } | null)?.response
      ?.data?.error?.message ||
    (setup.error as { response?: { data?: { error?: { message?: string } } } } | null)?.response?.data
      ?.error?.message ||
    '';

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
          p: { xs: 2.5, sm: 3.5 },
          width: '100%',
          maxWidth: 410,
          maxHeight: '92vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          borderRadius: 3,
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : 'rgba(255, 255, 255, 0.65)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.4)'}`,
          boxShadow: isDarkMode ? '0 24px 64px rgba(0, 0, 0, 0.35)' : tokens.shadow.card,
        }}
      >
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.25, fontSize: '0.95rem' }}>
          {APP_NAME}
        </Typography>
        <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: '-0.02em', mb: 0.75, fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
          Set up two-factor authentication
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.8rem' }}>
          Authenticator apps are required for every account. Scan the QR code, then save your backup codes.
        </Typography>

        <Stepper
          activeStep={backupCodes ? 2 : 1}
          alternativeLabel
          sx={{
            mb: 2,
            '& .MuiStepLabel-label': { fontSize: '0.75rem' },
          }}
        >
          <Step>
            <StepLabel>Scan QR</StepLabel>
          </Step>
          <Step>
            <StepLabel>Verify</StepLabel>
          </Step>
          <Step>
            <StepLabel>Backup codes</StepLabel>
          </Step>
        </Stepper>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem', py: 0.5 }}>
            {errorMessage}
          </Alert>
        )}

        {setup.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {!backupCodes && setup.data && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              <Box
                component="img"
                src={setup.data.qrDataUrl}
                alt="Authenticator QR code"
                sx={{ width: 150, height: 150, bgcolor: '#fff', borderRadius: 2, p: 0.75 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, textAlign: 'center', fontSize: '0.8rem' }}>
              Can&apos;t scan? Enter this key manually:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1.75 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.8rem' }}>
                {setup.data.secret}
              </Typography>
              <IconButton size="small" onClick={copySecret} aria-label="Copy secret key" sx={{ p: 0.25 }}>
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            <Box component="form" onSubmit={onVerify}>
              <TextField
                autoFocus
                fullWidth
                size="small"
                label="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6 }}
                sx={{ mb: 1.75, '& input': { fontSize: '0.875rem' } }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={verifySetup.isPending || code.length !== 6}
                sx={{
                  py: 1,
                  fontSize: '0.875rem',
                  borderRadius: tokens.radius.pill,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.primaryLight})`,
                }}
              >
                {verifySetup.isPending ? <CircularProgress size={20} color="inherit" /> : 'Verify and continue'}
              </Button>
            </Box>
          </>
        )}

        {backupCodes && (
          <>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Store these backup codes somewhere safe. Each code can be used only once if you lose access to your authenticator app.
            </Alert>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                p: 2,
                mb: 2,
                borderRadius: 2,
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                fontFamily: 'monospace',
              }}
            >
              {backupCodes.map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                  <Typography sx={{ fontFamily: 'inherit', fontWeight: 700, letterSpacing: '0.06em' }}>
                    {item}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={`Copy ${item}`}
                    onClick={async () => {
                      await navigator.clipboard.writeText(item);
                      addToast({ message: 'Copied', severity: 'success' });
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
            <Button startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />} onClick={copyBackupCodes} sx={{ mb: 1, textTransform: 'none' }}>
              Copy all
            </Button>
            <FormControlLabel
              control={<Checkbox checked={saved} onChange={(e) => setSaved(e.target.checked)} />}
              label="I have saved these backup codes"
            />
            <Button
              fullWidth
              variant="contained"
              disabled={!saved}
              onClick={finish}
              sx={{
                mt: 2,
                py: 1.4,
                borderRadius: tokens.radius.pill,
                fontWeight: 600,
                background: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.primaryLight})`,
              }}
            >
              Continue to app
            </Button>
          </>
        )}

        {activeStep < 2 && (
          <Box sx={{ mt: 2.5, textAlign: 'center' }}>
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
        )}
      </Paper>
    </Box>
  );
};

export default TwoFactorSetupPage;
