import { useState } from 'react';
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
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  keyframes,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MailOutline from '@mui/icons-material/MailOutline';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { loginSchema, type LoginFormData } from '@/utils/validators';
import { useLogin } from '@/hooks/api/useAuth';
import { APP_NAME } from '@/lib/constants';
import { tokens } from '@/styles/tokens';

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
`;

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data, {
      onSuccess: () => navigate('/'),
      onError: () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      },
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: isDarkMode ? '#0d0b11' : tokens.surface.main,
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease',
      }}
    >
      {isWide && (
        <Box
          className="login-brand-panel"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 6,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle geometric overlay glow */}
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,127,17,0.2) 0%, rgba(255,127,17,0) 70%)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -100,
              left: -50,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(93,26,137,0.3) 0%, rgba(93,26,137,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Logo Section */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1 }}
            className="animate-fade-in-up"
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${tokens.brand.accent}, ${tokens.brand.accentLight})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 16,
                boxShadow: '0 4px 14px rgba(255, 127, 17, 0.35)',
              }}
            >
              LS
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              {APP_NAME}
            </Typography>
          </Box>

          {/* Title and Intro */}
          <Box sx={{ zIndex: 1, mt: 'auto', mb: 4, maxWidth: 540 }} className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.04em',
                mb: 3,
                lineHeight: 1.1,
                fontSize: { md: '2.8rem', lg: '3.5rem' },
              }}
            >
              Technology That <br />
              Moves <span style={{ color: tokens.brand.accent }}>With Intelligence</span>
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.7, fontWeight: 300 }}>
              Your unified platform to automate LinkedIn lead workflows, track KPIs, and qualify prospects — powered by LEAP SOFTS.
            </Typography>
            <Box className="login-accent-bar" sx={{ height: 4, width: 80, borderRadius: 2, mt: 3 }} />
          </Box>

          {/* Feature Highlights List */}
          <Box
            className="animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
            sx={{
              zIndex: 1,
              p: 2.5,
              borderRadius: 4,
              maxWidth: 360,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, fontSize: '0.72rem' }}>
              Platform Highlights
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Highlight 1: AI Automation */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(255, 127, 17, 0.15)',
                    border: '1px solid rgba(255, 127, 17, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tokens.brand.accent,
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
                  </svg>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                    Lead Automation
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.75rem', mt: 0.1, lineHeight: 1.3 }}>
                    Automate outreach and qualification workflows.
                  </Typography>
                </Box>
              </Box>

              {/* Highlight 2: KPI & Analytics */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(141, 56, 201, 0.15)',
                    border: '1px solid rgba(141, 56, 201, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                    KPI Tracker
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.75rem', mt: 0.1, lineHeight: 1.3 }}>
                    Monitor sales activity targets in real-time.
                  </Typography>
                </Box>
              </Box>

              {/* Highlight 3: Intelligent Scheduling */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4ade80',
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                    Meeting Scheduler
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.75rem', mt: 0.1, lineHeight: 1.3 }}>
                    Schedule synced events with prospects.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Footer operational status */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              zIndex: 1,
              opacity: 0.6,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              pt: 3,
              mt: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2D8A5E' }} />
              <Typography variant="caption">All systems operational</Typography>
            </Box>
            <Typography variant="caption">v1.0.0</Typography>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          flex: isWide ? '0 0 540px' : 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Ambient background glows for the form column */}
        <Box
          className="animate-pulse-ambient"
          sx={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.06)'} 0%, rgba(0,0,0,0) 70%)`,
            top: '20%',
            left: '10%',
            zIndex: 0,
            pointerEvents: 'none',
            filter: 'blur(50px)',
          }}
        />
        <Box
          className="animate-pulse-ambient"
          sx={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${isDarkMode ? 'rgba(255, 127, 11, 0.1)' : 'rgba(255, 127, 11, 0.04)'} 0%, rgba(0,0,0,0) 70%)`,
            bottom: '20%',
            right: '10%',
            zIndex: 0,
            pointerEvents: 'none',
            filter: 'blur(45px)',
            animationDelay: '-6s',
          }}
        />

        <Paper
          elevation={0}
          className="login-glass-card animate-fade-in-up"
          sx={{
            p: { xs: 4, sm: 5 },
            width: '100%',
            maxWidth: 430,
            borderRadius: 6,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : 'rgba(255, 255, 255, 0.65)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.4)'}`,
            backdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: isDarkMode
              ? '0 24px 64px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(255, 255, 255, 0.05)'
              : tokens.shadow.card,
            animationDelay: '100ms',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {!isWide && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.accent})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  boxShadow: '0 4px 10px rgba(93, 26, 137, 0.2)',
                }}
              >
                LS
              </Box>
              <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
                {APP_NAME}
              </Typography>
            </Box>
          )}

          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              letterSpacing: '-0.03em',
              mb: 1,
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }}
          >
            Welcome back
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : tokens.text.secondary,
              mb: 4,
            }}
          >
            Sign in to continue to your workspace
          </Typography>



          {/* OAuth Single Sign On */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.68 1.4 7.57l3.79 2.94C6.1 7.6 8.84 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.02 3.67-8.64z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.19 14.77c-.24-.73-.38-1.52-.38-2.33s.14-1.6.38-2.33L1.4 7.17C.51 8.95 0 10.92 0 13s.51 4.05 1.4 5.83l3.79-3.06z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.11.75-2.53 1.2-4.2 1.2-3.16 0-5.9-2.56-6.81-5.47L1.4 15.97C3.37 19.86 7.35 23 12 23z"
                />
              </svg>
            }
            onClick={() => alert("Google SSO is configured for enterprise domains. Please contact admin.")}
            sx={{
              py: 1.2,
              borderRadius: 2.5,
              borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
              color: isDarkMode ? '#fff' : tokens.text.primary,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'transparent',
              fontWeight: 500,
              fontSize: '0.88rem',
              textTransform: 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                transform: 'translateY(-0.5px)',
              },
            }}
          >
            Sign in with Google
          </Button>

          {/* Separator */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
            <Typography
              variant="caption"
              sx={{
                px: 2,
                color: isDarkMode ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)',
                fontWeight: 500,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              or continue with email
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
          </Box>

          <Box 
            component="form" 
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              animation: shake ? `${shakeAnimation} 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both` : 'none',
            }}
          >
            {/* Email Input */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(26,22,37,0.85)',
                  fontSize: '0.85rem',
                }}
              >
                Email Address
              </Typography>
              <TextField
                {...register('email')}
                placeholder="you@example.com"
                type="email"
                fullWidth
                error={!!errors.email || login.isError}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutline sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)', mr: 0.5, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    bgcolor: isDarkMode ? 'rgba(26, 22, 37, 0.25)' : 'rgba(255, 255, 255, 0.85)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(26, 22, 37, 0.35)' : 'rgba(255, 255, 255, 0.95)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                    },
                    '&.Mui-focused': {
                      bgcolor: isDarkMode ? 'rgba(26, 22, 37, 0.3)' : '#fff',
                      boxShadow: `0 0 0 3px ${isDarkMode ? 'rgba(93, 26, 137, 0.18)' : 'rgba(93, 26, 137, 0.08)'}`,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: tokens.brand.primary,
                        borderWidth: '1px',
                      },
                    },
                  },
                }}
              />
            </Box>

            {/* Password Input */}
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(26,22,37,0.85)',
                    fontSize: '0.85rem',
                  }}
                >
                  Password
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: tokens.brand.primaryMuted,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    transition: 'color 0.2s',
                    '&:hover': { color: tokens.brand.accent },
                  }}
                  onClick={() => alert("Please contact your administrator to reset your password.")}
                >
                  Forgot password?
                </Typography>
              </Box>
              <TextField
                {...register('password')}
                placeholder="Enter password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.password || login.isError}
                helperText={errors.password?.message || (login.isError ? 'Incorrect email or password' : '')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)', mr: 0.5, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)', p: 0.5 }}
                      >
                        {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    bgcolor: isDarkMode ? 'rgba(26, 22, 37, 0.25)' : 'rgba(255, 255, 255, 0.85)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(26, 22, 37, 0.35)' : 'rgba(255, 255, 255, 0.95)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                    },
                    '&.Mui-focused': {
                      bgcolor: isDarkMode ? 'rgba(26, 22, 37, 0.3)' : '#fff',
                      boxShadow: `0 0 0 3px ${isDarkMode ? 'rgba(93, 26, 137, 0.18)' : 'rgba(93, 26, 137, 0.08)'}`,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: tokens.brand.primary,
                        borderWidth: '1px',
                      },
                    },
                  },
                }}
              />
            </Box>

            {/* Remember Me */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked
                    size="small"
                    sx={{
                      color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      '&.Mui-checked': {
                        color: tokens.brand.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', fontSize: '0.85rem' }}>
                    Keep me signed in
                  </Typography>
                }
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={login.isPending}
              sx={{
                mt: 3,
                py: 1.6,
                borderRadius: tokens.radius.pill,
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: '0.02em',
                background: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.primaryLight})`,
                boxShadow: `0 4px 20px ${isDarkMode ? 'rgba(93, 26, 137, 0.3)' : 'rgba(93, 26, 137, 0.2)'}`,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  background: `linear-gradient(135deg, ${tokens.brand.primaryLight}, ${tokens.brand.primaryDark})`,
                  boxShadow: `0 6px 24px ${isDarkMode ? 'rgba(93, 26, 137, 0.45)' : 'rgba(93, 26, 137, 0.3)'}`,
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'scale(0.985)',
                },
              }}
            >
              {login.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign in'
              )}
            </Button>
          </Box>
        </Paper>

        {/* Bottom context message */}
        <Typography
          variant="caption"
          className="animate-fade-in-up"
          style={{ animationDelay: '150ms' }}
          sx={{
            mt: 4,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : tokens.text.muted,
            fontSize: '0.75rem',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          Contact an admin if you need account access
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
