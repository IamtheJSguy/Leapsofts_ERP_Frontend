import { Box, Typography, Container, Chip, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BoltIcon from '@mui/icons-material/Bolt';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import { tokens } from '@/styles/tokens';
import { ScrollReveal } from './scroll/ScrollReveal';

export const BentoGridShowcase = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Base Modern Card Styling with Glassmorphism, Ambient Aura & Physics
  const getCardStyle = (accentGlow: string, topLightColor: string) => ({
    p: { xs: 3, md: 4 },
    borderRadius: '24px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    bgcolor: isDark ? 'rgba(23, 18, 32, 0.82)' : '#FFFFFF',
    backgroundImage: isDark
      ? `radial-gradient(circle at 15% 15%, ${accentGlow} 0%, transparent 65%), linear-gradient(145deg, rgba(28, 22, 39, 0.85) 0%, rgba(16, 13, 24, 0.95) 100%)`
      : `radial-gradient(circle at 12% 12%, ${accentGlow} 0%, transparent 60%), linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 247, 255, 0.9) 100%)`,
    border: '1px solid',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(93, 26, 137, 0.08)',
    boxShadow: isDark
      ? '0 16px 40px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      : '0 12px 35px -10px rgba(93, 26, 137, 0.07), 0 2px 6px rgba(0, 0, 0, 0.02)',
    backdropFilter: 'blur(16px)',
    transform: 'translate3d(0, 0, 0)',
    backfaceVisibility: 'hidden',
    willChange: 'transform',
    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    // Light-refracting top glass edge
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '12%',
      right: '12%',
      height: '1px',
      background: `linear-gradient(90deg, transparent, ${topLightColor}, transparent)`,
      opacity: isDark ? 0.65 : 0.45,
      transition: 'opacity 0.3s ease',
    },
    '&:hover': {
      transform: 'translateY(-6px)',
      borderColor: isDark ? 'rgba(168, 85, 247, 0.38)' : 'rgba(93, 26, 137, 0.22)',
      boxShadow: isDark
        ? `0 24px 50px -12px rgba(0, 0, 0, 0.8), 0 0 45px -8px ${accentGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.16)`
        : `0 24px 45px -12px rgba(93, 26, 137, 0.14), 0 0 35px -10px ${accentGlow}`,
      '&::before': {
        opacity: 1,
      },
      '& .bento-icon-badge': {
        transform: 'scale(1.08)',
        boxShadow: `0 8px 24px -4px ${accentGlow}`,
      },
    },
  });

  return (
    <Box id="bento-solutions" sx={{ py: { xs: 8, md: 14 } }}>
      <Container maxWidth="lg">
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Chip
                label="Unified Architecture"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  bgcolor: isDark ? 'rgba(255, 127, 17, 0.18)' : 'rgba(255, 127, 17, 0.12)',
                  color: tokens.brand.accent,
                  border: '1px solid',
                  borderColor: 'rgba(255, 127, 17, 0.25)',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 850,
                  fontSize: { xs: '2rem', sm: '2.8rem', md: '3.2rem' },
                  letterSpacing: '-0.03em',
                  background: isDark
                    ? 'linear-gradient(135deg, #FFFFFF 25%, #C084FC 65%, #FF7F11 100%)'
                    : 'linear-gradient(135deg, #14111B 25%, #5D1A89 65%, #EA580C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                Built for High-Growth Teams Who Value Speed.
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary',
                fontSize: '1.05rem',
                maxWidth: '680px',
                mx: 'auto',
              }}
            >
              Stop stitching disjointed tools together. Every feature in Leapsofts shares the same real-time data spine.
            </Typography>
          </Box>
        </ScrollReveal>

        {/* Bento Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {/* Bento Card 1: Intelligent Sales CRM (Span 2) */}
          <ScrollReveal variant="slide-left" delay={60} sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
            <Box
              sx={{
                ...getCardStyle('rgba(139, 92, 246, 0.22)', '#A855F7'),
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box
                  className="bento-icon-badge"
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '15px',
                    backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 20px -4px rgba(124, 58, 237, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 26 }} />
                </Box>
                <Chip
                  label="Dual Outreach Funnel"
                  size="small"
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.72rem',
                    bgcolor: isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(93, 26, 137, 0.08)',
                    color: isDark ? '#D8B4FE' : tokens.brand.primary,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(93, 26, 137, 0.16)',
                  }}
                />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.2, color: isDark ? '#FFFFFF' : tokens.text.primary, letterSpacing: '-0.02em' }}>
                Multi-Channel Sales CRM & Pipeline
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.68)' : 'text.secondary', lineHeight: 1.65, mb: 3 }}>
                Orchestrate LinkedIn outreach and cold calling stages in one place. Push qualified prospects directly into departmental Kanban boards with full audit placement history and automated future-date reminders.
              </Typography>
            </Box>

            {/* Elevated Frosted Glass Feature Tray */}
            <Box
              sx={{
                p: 2.25,
                borderRadius: '18px',
                bgcolor: isDark ? 'rgba(18, 14, 25, 0.6)' : 'rgba(248, 245, 254, 0.85)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(93, 26, 137, 0.08)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.2,
              }}
            >
              {[
                { label: 'LinkedIn Connection Stages', icon: <CheckCircleOutlineIcon sx={{ fontSize: 15, color: '#A855F7' }} /> },
                { label: 'Cold Calling Dial Tiers (1-3)', icon: <PhoneInTalkIcon sx={{ fontSize: 15, color: '#38BDF8' }} /> },
                { label: 'Future Lead Date Scheduler', icon: <AccessTimeIcon sx={{ fontSize: 15, color: '#F59E0B' }} /> },
                { label: 'Instant Kanban Board Push', icon: <ViewKanbanIcon sx={{ fontSize: 15, color: '#10B981' }} /> },
              ].map((feature, i) => (
                <Chip
                  key={i}
                  icon={feature.icon}
                  label={feature.label}
                  size="small"
                  sx={{
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    fontWeight: 650,
                    fontSize: '0.74rem',
                    py: 1.8,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: '#A855F7',
                      bgcolor: isDark ? 'rgba(168, 85, 247, 0.12)' : '#FAF5FF',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </ScrollReveal>

        {/* Bento Card 2: Invoicing Studio (Span 1) */}
        <ScrollReveal variant="slide-right" delay={120} sx={{ gridColumn: { xs: '1 / -1', md: 'span 1' } }}>
          <Box
            sx={{
              ...getCardStyle('rgba(255, 127, 17, 0.22)', '#FF7F11'),
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box
                  className="bento-icon-badge"
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '15px',
                    backgroundImage: 'linear-gradient(135deg, #EA580C 0%, #FF7F11 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 20px -4px rgba(255, 127, 17, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ReceiptLongIcon sx={{ fontSize: 26 }} />
                </Box>
                <Chip
                  label="5 Designer Styles"
                  size="small"
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.72rem',
                    bgcolor: isDark ? 'rgba(255, 127, 17, 0.18)' : 'rgba(255, 127, 17, 0.1)',
                    color: tokens.brand.accent,
                    border: '1px solid',
                    borderColor: 'rgba(255, 127, 17, 0.25)',
                  }}
                />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.2, color: isDark ? '#FFFFFF' : tokens.text.primary, letterSpacing: '-0.02em' }}>
                Invoicing & Billing Studio
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.68)' : 'text.secondary', lineHeight: 1.65, mb: 3 }}>
                Generate high-resolution PDF invoices instantly in Modern, Classic, Compact, Minimal, or Bold templates. Includes automated tax calculations and direct SMTP email dispatch.
              </Typography>
            </Box>

            {/* Elevated Frosted Currency & Dispatch Micro-Trays */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  px: 2,
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(18, 14, 25, 0.6)' : 'rgba(248, 245, 254, 0.85)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(93, 26, 137, 0.08)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'rgba(255, 127, 17, 0.3)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyExchangeIcon sx={{ fontSize: 16, color: tokens.brand.accent }} />
                  <Typography variant="caption" fontWeight={750} color={isDark ? '#FFFFFF' : tokens.text.primary}>
                    Multi-Currency
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {['PKR', 'USD', 'EUR', 'AED'].map((curr) => (
                    <Typography
                      key={curr}
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.66rem',
                        px: 0.75,
                        py: 0.2,
                        borderRadius: '6px',
                        bgcolor: isDark ? 'rgba(255, 127, 17, 0.15)' : 'rgba(255, 127, 17, 0.12)',
                        color: tokens.brand.accent,
                      }}
                    >
                      {curr}
                    </Typography>
                  ))}
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  px: 2,
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(18, 14, 25, 0.6)' : 'rgba(248, 245, 254, 0.85)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(93, 26, 137, 0.08)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MarkEmailReadIcon sx={{ fontSize: 16, color: '#10B981' }} />
                  <Typography variant="caption" fontWeight={750} color={isDark ? '#FFFFFF' : tokens.text.primary}>
                    Direct Dispatch
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight={800} sx={{ color: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.12)', px: 1, py: 0.3, borderRadius: '6px' }}>
                  Gmail · Outlook · Zoho
                </Typography>
              </Box>
            </Box>
          </Box>
        </ScrollReveal>

        {/* Bento Card 3: Unified Tasks & KPIs (Span 1) */}
        <ScrollReveal variant="slide-left" delay={160} sx={{ gridColumn: { xs: '1 / -1', md: 'span 1' } }}>
          <Box
            sx={{
              ...getCardStyle('rgba(16, 185, 129, 0.2)', '#10B981'),
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box
                  className="bento-icon-badge"
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '15px',
                    backgroundImage: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ViewKanbanIcon sx={{ fontSize: 26 }} />
                </Box>
                <Chip
                  label="Dual-Track KPIs"
                  size="small"
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.72rem',
                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981',
                    border: '1px solid',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                  }}
                />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.2, color: isDark ? '#FFFFFF' : tokens.text.primary, letterSpacing: '-0.02em' }}>
                Automated KPI Engine
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.68)' : 'text.secondary', lineHeight: 1.65, mb: 3 }}>
                KPIs auto-progress directly as reps log prospect calls and connection messages. Complete with formal change-request approval workflows.
              </Typography>
            </Box>

            {/* Glowing Priority Triage Pills */}
            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(18, 14, 25, 0.6)' : 'rgba(248, 245, 254, 0.85)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(93, 26, 137, 0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.55)' : 'text.secondary', fontWeight: 750, fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                  PRIORITY TRIAGE TIERS
                </Typography>
                <BoltIcon sx={{ fontSize: 15, color: '#10B981' }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Urgent', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.18)' },
                  { label: 'High', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.18)' },
                  { label: 'Medium', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.18)' },
                  { label: 'Low', color: '#10B981', bg: 'rgba(16, 185, 129, 0.18)' },
                ].map((tier) => (
                  <Chip
                    key={tier.label}
                    label={tier.label}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.67rem',
                      fontWeight: 800,
                      bgcolor: tier.bg,
                      color: tier.color,
                      border: '1px solid',
                      borderColor: tier.color,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.05)' },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </ScrollReveal>

        {/* Bento Card 4: Workforce Telemetry & Shifts (Span 2) */}
        <ScrollReveal variant="slide-right" delay={200} sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}>
          <Box
            sx={{
              ...getCardStyle('rgba(99, 102, 241, 0.22)', '#6366F1'),
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box
                  className="bento-icon-badge"
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '15px',
                    backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: 26 }} />
                </Box>
                <Chip
                  label="Desktop Monitoring"
                  size="small"
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.72rem',
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.1)',
                    color: '#6366F1',
                    border: '1px solid',
                    borderColor: 'rgba(99, 102, 241, 0.25)',
                  }}
                />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.2, color: isDark ? '#FFFFFF' : tokens.text.primary, letterSpacing: '-0.02em' }}>
                Workforce Shift Telemetry & Consent Monitoring
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.68)' : 'text.secondary', lineHeight: 1.65, mb: 3 }}>
                Real-time shift clocking with multi-session tracking, automatic lateness calculation, and break classification (idle, manual, sleep). Includes background 10-minute screenshot intervals and active application & domain telemetry.
              </Typography>
            </Box>

            {/* Glowing Live Radar & Telemetry Tray */}
            <Box
              sx={{
                p: 2.25,
                borderRadius: '18px',
                bgcolor: isDark ? 'rgba(18, 14, 25, 0.6)' : 'rgba(248, 245, 254, 0.85)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(93, 26, 137, 0.08)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.55)' : 'text.secondary', fontWeight: 700, display: 'block', mb: 0.3 }}>
                  Productivity Metrics Engine
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : tokens.text.primary }}>
                  Keyboard & Mouse Intensity + Domain Classification
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#10B981',
                    boxShadow: '0 0 10px #10B981',
                    animation: 'pulseDot 2s infinite ease-in-out',
                    '@keyframes pulseDot': {
                      '0%': { transform: 'scale(0.95)', opacity: 0.7 },
                      '50%': { transform: 'scale(1.35)', opacity: 1 },
                      '100%': { transform: 'scale(0.95)', opacity: 0.7 },
                    },
                  }}
                />
                <Chip
                  label="Consent Enforced"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </ScrollReveal>

        {/* Bento Card 5: Real-time Collaboration (Full Width / Span 3) */}
        <ScrollReveal variant="scale-up" delay={240} sx={{ gridColumn: '1 / -1' }}>
          <Box
            sx={{
              ...getCardStyle('rgba(168, 85, 247, 0.22)', '#C026D3'),
              height: '100%',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 4,
            }}
          >
            <Box sx={{ maxWidth: '640px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  className="bento-icon-badge"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    backgroundImage: 'linear-gradient(135deg, #9333EA 0%, #C026D3 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 20px -4px rgba(192, 38, 211, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 24 }} />
                </Box>
                <Chip
                  label="Realtime WebSockets"
                  size="small"
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.72rem',
                    bgcolor: isDark ? 'rgba(192, 38, 211, 0.18)' : 'rgba(93, 26, 137, 0.08)',
                    color: isDark ? '#F5D0FE' : tokens.brand.primary,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(192, 38, 211, 0.3)' : 'rgba(93, 26, 137, 0.15)',
                  }}
                />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.2, color: isDark ? '#FFFFFF' : tokens.text.primary, letterSpacing: '-0.02em' }}>
                Native Team Chat, Meetings & Google Drive Hub
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.68)' : 'text.secondary', lineHeight: 1.65 }}>
                Direct and group messaging with delivery/read receipts, emoji reactions, and live Kanban card event updates in chat. Attach documents directly via Google Drive integration or schedule Zoom/Meet sync calls linked to project cards.
              </Typography>
            </Box>

            {/* Glowing Interactive Feature Chips */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.2,
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                maxWidth: { md: '440px' },
              }}
            >
              {[
                { label: 'Read/Delivered Receipts', color: '#38BDF8' },
                { label: 'Google Drive Picker', color: '#F59E0B' },
                { label: 'Meeting Scheduler', color: '#10B981' },
                { label: 'Emoji Reactions', color: '#EC4899' },
                { label: 'Kanban Event Feed', color: '#A855F7' },
              ].map((tag, i) => (
                <Chip
                  key={i}
                  label={tag.label}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)',
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: tag.color,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#FAF8FD',
                      boxShadow: `0 4px 12px -2px ${tag.color}40`,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </ScrollReveal>
        </Box>
      </Container>
    </Box>
  );
};
