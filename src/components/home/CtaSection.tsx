import { Box, Typography, Button, Container, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { tokens } from '@/styles/tokens';
import { useAuthStore } from '@/store/useAuthStore';
import { ScrollReveal } from './scroll/ScrollReveal';

export const CtaSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, position: 'relative' }}>
      <Container maxWidth="lg">
        <ScrollReveal variant="scale-up" duration={0.85} distance={36}>
          <Box
            sx={{
              borderRadius: { xs: '24px', md: '36px' },
              p: { xs: 4, sm: 6, md: 8 },
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              background: isDark
                ? 'linear-gradient(135deg, rgba(69, 19, 102, 0.95) 0%, rgba(93, 26, 137, 0.85) 50%, rgba(26, 22, 37, 0.95) 100%)'
                : 'linear-gradient(135deg, #451366 0%, #5D1A89 60%, #7B3DA8 100%)',
              color: '#FFFFFF',
              boxShadow: '0 24px 60px rgba(93, 26, 137, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
          {/* Subtle Ambient Glow Circles inside CTA (Hardware-accelerated shader gradient) */}
          <Box
            sx={{
              position: 'absolute',
              top: '-30%',
              left: '50%',
              transform: 'translate3d(-50%, 0, 0)',
              width: '600px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 127, 17, 0.35) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '720px', mx: 'auto' }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 850,
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem' },
                letterSpacing: '-0.035em',
                lineHeight: 1.15,
                background: 'linear-gradient(135deg, #FFFFFF 40%, #FED7AA 75%, #FF7F11 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                mb: 2.5,
              }}
            >
              Ready to Modernize Your Enterprise Operations?
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', sm: '1.15rem' },
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.85)',
                mb: 4.5,
              }}
            >
              Consolidate your outbound sales CRM, multi-currency client billing, departmental task boards, and workforce attendance into one unified portal.
            </Typography>

            <ScrollReveal variant="fade-up" delay={160}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: tokens.brand.primaryDark,
                    fontWeight: 800,
                    fontSize: '1rem',
                    py: 1.6,
                    px: 4,
                    borderRadius: '999px',
                    textTransform: 'none',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      bgcolor: '#F3E8FF',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
                    },
                  }}
                >
                  {isAuthenticated ? 'Launch Workspace' : 'Get Started Now'}
                </Button>

                {!isAuthenticated && (
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/login')}
                    startIcon={<LockOutlinedIcon />}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.35)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '1rem',
                      py: 1.5,
                      px: 3.5,
                      borderRadius: '999px',
                      textTransform: 'none',
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        borderColor: '#FFFFFF',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Portal Sign In
                  </Button>
                )}
              </Box>
            </ScrollReveal>
          </Box>
        </Box>
        </ScrollReveal>
      </Container>
    </Box>
  );
};
