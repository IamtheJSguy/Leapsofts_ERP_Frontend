import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { loginSchema, type LoginFormData } from '@/utils/validators';
import { useLogin } from '@/hooks/api/useAuth';
import { APP_NAME } from '@/lib/constants';
import { tokens } from '@/styles/tokens';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('md'));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data, {
      onSuccess: () => navigate('/'),
      onError: () => {},
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: tokens.surface.main,
      }}
    >
      {isWide && (
        <Box
          className="login-brand-panel"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: 6,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 280,
              height: 280,
              borderRadius: '50%',
              bgcolor: 'rgba(255,127,17,0.15)',
            }}
          />
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${tokens.brand.accent}, ${tokens.brand.accentLight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            B2
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 2 }}>
            {APP_NAME}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 400, lineHeight: 1.7 }}>
            Automate LinkedIn lead workflows, track KPIs, and qualify prospects — powered by LEAP
            SOFTS.
          </Typography>
          <Box className="login-accent-bar" sx={{ height: 4, width: 80, borderRadius: 2, mt: 4 }} />
        </Box>
      )}

      <Box
        sx={{
          flex: isWide ? '0 0 480px' : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            maxWidth: 420,
            borderRadius: 4,
            border: `1px solid ${tokens.surface.border}`,
            boxShadow: tokens.shadow.card,
          }}
        >
          {!isWide && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.accent})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                B2
              </Box>
              <Typography variant="h6" fontWeight={700}>
                {APP_NAME}
              </Typography>
            </Box>
          )}

          <Typography variant="h5" fontWeight={700} gutterBottom>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to continue to your workspace
          </Typography>

          {login.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(login.error as { response?: { data?: { error?: { message?: string } } } })?.response
                ?.data?.error?.message || 'Login failed'}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('email')}
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              {...register('password')}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3, py: 1.5 }}
              disabled={login.isPending}
            >
              {login.isPending ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoginPage;
