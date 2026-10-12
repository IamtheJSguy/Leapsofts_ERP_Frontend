import React from 'react';
import { Box, Typography, Container, useTheme } from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import LanguageIcon from '@mui/icons-material/Language';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { tokens } from '@/styles/tokens';
import { ScrollReveal } from './scroll/ScrollReveal';

const STATS = [
  {
    icon: <FlashOnIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />,
    value: '5x Faster',
    label: 'Pipeline to Cash Cycle',
    detail: 'Seamlessly convert leads to Kanban cards & issued invoices.',
    color: '#FF7F11',
    gradient: 'linear-gradient(135deg, #EA580C 0%, #FF7F11 100%)',
    ambientGlow: 'rgba(255, 127, 17, 0.18)',
  },
  {
    icon: <LanguageIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />,
    value: '12+ Currencies',
    label: 'Global Invoicing Studio',
    detail: 'PKR, USD, EUR, GBP, AED, SAR with automated tax compliance.',
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
    ambientGlow: 'rgba(168, 85, 247, 0.18)',
  },
  {
    icon: <InsightsOutlinedIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />,
    value: '99.8% Attainment',
    label: 'Automated KPI Tracking',
    detail: 'Pipeline-driven target attribution without manual data entry.',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    ambientGlow: 'rgba(16, 185, 129, 0.18)',
  },
  {
    icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />,
    value: '100% Compliant',
    label: 'Transparent Telemetry',
    detail: 'Explicit employee consent & privacy safeguards for all tracking.',
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
    ambientGlow: 'rgba(99, 102, 241, 0.18)',
  },
];

export const MetricCounterBar: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      id="features"
      sx={{
        py: { xs: 6, md: 9 },
        bgcolor: 'transparent',
        position: 'relative',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
            gap: { xs: 3, lg: 3.5 },
          }}
        >
          {STATS.map((item, idx) => (
            <ScrollReveal
              key={idx}
              variant="fade-up"
              delay={idx * 80}
              duration={0.7}
              distance={36}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: { xs: 3, md: 3.5 },
                  borderRadius: '24px',
                  bgcolor: isDark ? 'rgba(23, 18, 32, 0.92)' : 'rgba(255, 255, 255, 0.9)',
                  backgroundImage: isDark
                    ? `radial-gradient(circle at 15% 15%, ${item.ambientGlow} 0%, transparent 65%)`
                    : `radial-gradient(circle at 15% 15%, ${item.ambientGlow} 0%, transparent 60%)`,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.09)',
                  boxShadow: isDark
                    ? '0 16px 40px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
                    : '0 16px 40px -15px rgba(93, 26, 137, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                  // Light beam on top edge: ambient subtle highlight, sweeps across on hover
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '60%',
                    height: '2px',
                    background: `linear-gradient(90deg, transparent, ${item.color}, #FFFFFF, ${item.color}, transparent)`,
                    opacity: 0,
                    pointerEvents: 'none',
                    transform: 'translate3d(-100%, 0, 0)',
                    transition: 'opacity 0.2s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: item.color,
                    boxShadow: isDark
                      ? `0 24px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px -8px ${item.ambientGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                      : `0 24px 45px -12px rgba(93, 26, 137, 0.15), 0 0 30px -8px ${item.ambientGlow}, inset 0 1px 0 rgba(255, 255, 255, 1)`,
                    '&::after': {
                      opacity: 1,
                      animation: 'shimmerSweep 1.6s cubic-bezier(0.4, 0, 0.2, 1) 1',
                    },
                    '& .metric-icon-badge': {
                      transform: 'scale(1.08)',
                      boxShadow: `0 8px 24px -4px ${item.color}70`,
                    },
                  },
                }}
              >
                {/* Radiant Icon Badge */}
                <Box
                  className="metric-icon-badge"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    backgroundImage: item.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                    boxShadow: `0 8px 20px -4px ${item.color}50`,
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {item.icon}
                </Box>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 850,
                    fontSize: { xs: '1.65rem', md: '1.95rem' },
                    letterSpacing: '-0.03em',
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    mb: 0.5,
                  }}
                >
                  {item.value}
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.9rem',
                    color: isDark ? '#E9D5FF' : tokens.brand.primaryDark,
                    mb: 0.75,
                  }}
                >
                  {item.label}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary',
                    fontSize: '0.78rem',
                    lineHeight: 1.55,
                    display: 'block',
                    flexGrow: 1,
                  }}
                >
                  {item.detail}
                </Typography>
              </Box>
            </ScrollReveal>
          ))}
        </Box>
      </Container>
    </Box>
  );
};
