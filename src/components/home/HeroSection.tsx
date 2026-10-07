import { Box, Typography, Button, Container, Chip, Avatar, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SparklesIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import { tokens } from '@/styles/tokens';
import { useAuthStore } from '@/store/useAuthStore';
import { RealErpShowcaseWindow } from './showcase/RealErpShowcaseWindow';
import { ScrollReveal } from './scroll/ScrollReveal';

export const HeroSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handlePrimaryClick = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  const handleDemoClick = () => {
    const el = document.getElementById('interactive-demo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        pt: { xs: 2, md: 4 },
        pb: { xs: 8, md: 14 },
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Eyebrow Pill */}
        <ScrollReveal variant="fade-down" delay={60}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.25,
              px: 2.25,
              py: 0.75,
              borderRadius: '999px',
              bgcolor: isDark ? 'rgba(93, 26, 137, 0.22)' : 'rgba(93, 26, 137, 0.08)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(93, 26, 137, 0.2)',
              boxShadow: '0 4px 20px rgba(93, 26, 137, 0.15)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                borderColor: tokens.brand.accent,
              },
            }}
          >
            <SparklesIcon sx={{ fontSize: 16, color: tokens.brand.accent }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 750,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: '0.74rem',
                color: isDark ? '#E9D5FF' : tokens.brand.primaryDark,
              }}
            >
              Enterprise Operating System v2.0
            </Typography>
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: tokens.brand.accent,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 650,
                fontSize: '0.74rem',
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
              }}
            >
              All Modules Integrated
            </Typography>
            </Box>
          </Box>
        </ScrollReveal>

        {/* Main Headline */}
        <ScrollReveal variant="fade-up" delay={120}>
          <Box sx={{ textAlign: 'center', maxWidth: '960px', mx: 'auto', mb: 3.5 }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 850,
                fontSize: { xs: '2.4rem', sm: '3.6rem', md: '4.4rem' },
                lineHeight: { xs: 1.15, sm: 1.1 },
                letterSpacing: { xs: '-0.03em', md: '-0.04em' },
                color: isDark ? '#FFFFFF' : '#14111B',
                mb: 2.5,
              }}
            >
              Accelerate Pipeline.{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #FF7F11 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                Automate Finance.
              </Box>
              <br />
              Orchestrate Your Entire Team.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', sm: '1.2rem' },
                lineHeight: 1.6,
                color: isDark ? 'rgba(255, 255, 255, 0.72)' : '#4A4458',
                maxWidth: '760px',
                mx: 'auto',
                fontWeight: 450,
              }}
            >
              The unified enterprise platform bridging LinkedIn & cold outbound CRM, multi-currency invoicing, departmental Kanban boards, and real-time shift telemetry into a single, high-velocity workspace.
            </Typography>
          </Box>
        </ScrollReveal>

        {/* Primary Call to Action Buttons */}
        <ScrollReveal variant="fade-up" delay={180}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: { xs: 6, md: 8 },
            }}
          >
            <Button
              variant="contained"
              onClick={handlePrimaryClick}
              endIcon={<ArrowForwardIcon />}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                px: 4,
                py: 1.6,
                fontSize: '1rem',
                fontWeight: 800,
                borderRadius: '999px',
                bgcolor: tokens.brand.primary,
                color: '#FFFFFF',
                boxShadow: '0 8px 32px rgba(93, 26, 137, 0.45)',
                textTransform: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: tokens.brand.primaryLight,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(93, 26, 137, 0.65)',
                },
              }}
            >
              {isAuthenticated ? 'Launch Workspace' : 'Get Started with Leapsofts'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleDemoClick}
              startIcon={<PlayArrowIcon sx={{ color: tokens.brand.accent }} />}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                px: 3.5,
                py: 1.5,
                fontSize: '0.98rem',
                fontWeight: 700,
                borderRadius: '999px',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(93, 26, 137, 0.25)',
                color: isDark ? '#FFFFFF' : tokens.brand.primaryDark,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(93, 26, 137, 0.06)',
                  borderColor: tokens.brand.accent,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Explore Interactive Demo
            </Button>
          </Box>
        </ScrollReveal>

        {/* Authentic Leapsofts ERP Showcase Window */}
        <ScrollReveal variant="perspective-tilt" delay={220} duration={0.9} distance={42}>
          <Box
            id="interactive-demo"
            sx={{
              position: 'relative',
              mx: 'auto',
              maxWidth: '1020px',
              borderRadius: { xs: '20px', md: '24px' },
              p: { xs: 0.5, sm: 1 },
              background: isDark
                ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.35) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(93, 26, 137, 0.2) 100%)'
                : 'linear-gradient(180deg, rgba(93, 26, 137, 0.2) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 127, 17, 0.15) 100%)',
              boxShadow: isDark
                ? '0 24px 80px -20px rgba(0, 0, 0, 0.8), 0 0 50px rgba(93, 26, 137, 0.25)'
                : '0 24px 70px -20px rgba(93, 26, 137, 0.18), 0 10px 30px rgba(0, 0, 0, 0.05)',
            }}
          >
            <RealErpShowcaseWindow />
          </Box>
        </ScrollReveal>
      </Container>
    </Box>
  );
};
