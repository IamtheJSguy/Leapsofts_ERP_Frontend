import { Box, Typography, Button, Container, Chip, Avatar, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useNavigate } from 'react-router-dom';
import { tokens } from '@/styles/tokens';
import { useAuthStore } from '@/store/useAuthStore';
import { RealErpShowcaseWindow } from './showcase/RealErpShowcaseWindow';
import { ScrollReveal } from './scroll/ScrollReveal';
import { FlipCalendarWord } from './FlipCalendarWord';
import { TypingOperatingSystem } from './TypingOperatingSystem';

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
            <TypingOperatingSystem isDark={isDark} />
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
                lineHeight: { xs: 1.18, sm: 1.12 },
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
                Empower{' '}
                <FlipCalendarWord
                  words={['Operations', 'Workflows', 'Execution', 'Performance', 'Delivery']}
                  intervalMs={2800}
                />
                .
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
              The unified enterprise platform bridging LinkedIn & cold outbound CRM, automated daily KPI tracking, departmental Kanban boards, and real-time shift telemetry into a single, high-velocity workspace.
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
              startIcon={!isAuthenticated ? <AutoAwesomeOutlinedIcon sx={{ fontSize: 18, color: '#FFD79E' }} /> : undefined}
              endIcon={<ArrowForwardIcon className="btn-arrow" sx={{ fontSize: 18 }} />}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 800,
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #581C87 50%, #3B0764 100%)',
                color: '#FFFFFF',
                boxShadow: '0 8px 32px rgba(93, 26, 137, 0.45)',
                textTransform: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '& .btn-arrow': {
                  transition: 'transform 0.2s ease',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6B21A8 50%, #4C1D95 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(124, 58, 237, 0.65)',
                  '& .btn-arrow': {
                    transform: 'translateX(4px)',
                  },
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
