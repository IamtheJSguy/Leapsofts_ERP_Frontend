import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Chip,
  useTheme,
  Button,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import { tokens } from '@/styles/tokens';
import { ScrollReveal } from './scroll/ScrollReveal';

interface LifecycleStage {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  description: string;
  metrics: { label: string; value: string }[];
  highlightFeatures: string[];
}

export const OperationalLifecycleSection: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Operational Flow State
  const [activeStage, setActiveStage] = useState<number>(0);

  const STAGES: LifecycleStage[] = [
    {
      id: 0,
      badge: 'STAGE 1: OMNICHANNEL INGESTION',
      title: 'Multi-Channel Outreach & Lead Discovery',
      subtitle: 'Capture prospects across LinkedIn and phone dialers into a unified pipeline.',
      icon: <TrendingUpIcon sx={{ fontSize: 24 }} />,
      color: '#A855F7',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
      description:
        'Sales development reps run LinkedIn connection sequences and structured 3-tier cold calling cadences. Every prospect interaction, call duration, and response status is automatically captured into the centralized CRM with automated future-date reminders.',
      metrics: [
        { label: 'Outreach Channels', value: 'LinkedIn + Dial Tiers' },
        { label: 'Ingestion Latency', value: '< 150ms' },
        { label: 'Lead Classification', value: 'Tier 1 to 3 Auto-Tag' },
      ],
      highlightFeatures: [
        'Structured Tier 1-3 Calling Workflows',
        'Direct LinkedIn Status Tracking',
        'Future Follow-up Lead Scheduler',
        'Duplicate Detection & Territory Routing',
      ],
    },
    {
      id: 1,
      badge: 'STAGE 2: ZERO-LOSS DISPATCH',
      title: '1-Click Departmental Project Push',
      subtitle: 'Instantly convert qualified prospects into active Kanban execution boards.',
      icon: <ViewKanbanIcon sx={{ fontSize: 24 }} />,
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
      description:
        'When a lead accepts an agreement, the sales rep clicks "Push to Project Kanban". In milliseconds, all contract notes, client files, and deal values migrate directly to the Delivery team’s sprint board without human re-typing or broken Zapier webhooks.',
      metrics: [
        { label: 'Conversion Speed', value: 'Instant 1-Click' },
        { label: 'Data Re-entry', value: '0% Manual Work' },
        { label: 'Audit Trail', value: '100% History Preserved' },
      ],
      highlightFeatures: [
        'Instant Departmental Kanban Card Generation',
        'Contract & Requirements Auto-Attachment',
        'Automated Sprint Owner Assignment',
        'Formal Change-Request Workflows',
      ],
    },
    {
      id: 2,
      badge: 'STAGE 3: VERIFIED EXECUTION',
      title: 'Real-time Sprints & Consent Telemetry',
      subtitle: 'Track project milestones and shift productivity with employee-consented telemetry.',
      icon: <AccessTimeIcon sx={{ fontSize: 24 }} />,
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      description:
        'Engineers and project members execute sprint cards while background shift telemetry records active sessions, break classification (idle, manual, sleep), and domain intensity under formal employee consent. Team chat links directly to live task card updates.',
      metrics: [
        { label: 'Shift Accuracy', value: '99.98% Clock Integrity' },
        { label: 'Consent Protocol', value: '100% Transparent' },
        { label: 'Collaboration', value: 'Live WebSocket Chat' },
      ],
      highlightFeatures: [
        'Multi-session Shift Clocking & Idle Detection',
        'Transparent 10-Min Screenshot Intervals',
        'Application & Domain Productivity Meter',
        'WebSocket Meeting Sync with Google Meet',
      ],
    },
    {
      id: 3,
      badge: 'STAGE 4: REVENUE SETTLEMENT',
      title: 'Automated Billing & Direct SMTP Dispatch',
      subtitle: 'Draft professional multi-currency invoices and email directly to clients.',
      icon: <ReceiptLongIcon sx={{ fontSize: 24 }} />,
      color: '#FF7F11',
      gradient: 'linear-gradient(135deg, #EA580C 0%, #FF7F11 100%)',
      description:
        'Upon milestone sign-off, Leapsofts Invoicing Studio automatically drafts high-res PDF invoices in Modern, Classic, Compact, Minimal, or Bold templates. Calculates localized taxes, formats currency in PKR, USD, EUR, or AED, and delivers directly through your corporate Gmail or Outlook.',
      metrics: [
        { label: 'Invoice Templates', value: '5 Designer Styles' },
        { label: 'Currency Support', value: 'PKR · USD · EUR · AED' },
        { label: 'Dispatch Protocol', value: 'Native SMTP (No Middlemen)' },
      ],
      highlightFeatures: [
        'Instant High-Resolution PDF Rendering',
        'Automated Tax Calculation & Itemization',
        'Direct SMTP Dispatch (Gmail, Outlook, Zoho)',
        'Payment Status Tracking & Receipt Records',
      ],
    },
  ];

  const currentStage = STAGES[activeStage];

  return (
    <Box id="operational-lifecycle" sx={{ py: { xs: 8, md: 14 }, position: 'relative' }}>
      <Container maxWidth="lg">
        {/* ========================================================================= */}
        {/* SECTION HEADER                                                            */}
        {/* ========================================================================= */}
        <ScrollReveal variant="fade-up">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: 14, color: tokens.brand.accent }} />}
                label="The Unified Operational Data Spine"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  bgcolor: isDark ? 'rgba(255, 127, 17, 0.16)' : 'rgba(255, 127, 17, 0.1)',
                  color: tokens.brand.accent,
                  border: '1px solid',
                  borderColor: 'rgba(255, 127, 17, 0.25)',
                  px: 0.5,
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
                    ? 'linear-gradient(135deg, #FFFFFF 25%, #C084FC 65%, #38BDF8 100%)'
                    : 'linear-gradient(135deg, #14111B 25%, #7C3AED 65%, #0284C7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                How Enterprise Work Actually Flows.
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.68)' : 'text.secondary',
                fontSize: '1.05rem',
                maxWidth: '720px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              In legacy companies, work dies between siloed tools. In Leapsofts, a single prospect moves effortlessly from cold discovery to project delivery and paid invoice without a single manual copy-paste.
            </Typography>
          </Box>
        </ScrollReveal>

        {/* ========================================================================= */}
        {/* PART 1: INTERACTIVE 4-STAGE OPERATIONAL LIFECYCLE SCRUBBER               */}
        {/* ========================================================================= */}
        <ScrollReveal variant="blur-reveal" delay={80} duration={0.85}>
          <Box
            sx={{
              borderRadius: '24px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(255, 255, 255, 0.55)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.08)',
            boxShadow: isDark
              ? '0 20px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 20px 50px -15px rgba(93, 26, 137, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            overflow: 'hidden',
            p: { xs: 2.5, sm: 3.5, md: 5 },
            mb: { xs: 8, md: 12 },
            position: 'relative',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60%',
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${currentStage.color}, #FFFFFF, ${currentStage.color}, transparent)`,
              animation: 'shimmerSweep 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              willChange: 'transform',
              pointerEvents: 'none',
            },
          }}
        >
          {/* Stage Step Selector Tabs */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 1.5,
              mb: 4,
            }}
          >
            {STAGES.map((stage, idx) => {
              const isSelected = activeStage === idx;
              return (
                <Box
                  key={stage.id}
                  onClick={() => setActiveStage(idx)}
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    bgcolor: isSelected
                      ? isDark
                        ? 'rgba(255, 255, 255, 0.07)'
                        : 'rgba(93, 26, 137, 0.05)'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.02)'
                        : '#FBF9FE',
                    border: '1px solid',
                    borderColor: isSelected
                      ? stage.color
                      : isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.05)',
                    boxShadow: isSelected
                      ? isDark
                        ? `0 8px 24px -6px ${stage.color}40`
                        : `0 8px 20px -6px ${stage.color}25`
                      : 'none',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: stage.color,
                    },
                  }}
                >
                  {/* Step Number Tag */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '10px',
                        backgroundImage: isSelected ? stage.gradient : 'none',
                        bgcolor: isSelected ? 'transparent' : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                        color: isSelected ? '#FFFFFF' : isDark ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.66rem',
                        color: isSelected ? stage.color : isDark ? 'rgba(255, 255, 255, 0.4)' : 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Step 0{idx + 1}
                    </Typography>
                  </Box>

                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      color: isDark ? '#FFFFFF' : tokens.text.primary,
                      lineHeight: 1.25,
                      mb: 0.5,
                    }}
                  >
                    {stage.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary',
                      display: 'block',
                      lineHeight: 1.35,
                      fontSize: '0.72rem',
                    }}
                  >
                    {stage.subtitle}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Active Stage Deep Dive Display */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' },
              gap: 4,
              p: { xs: 2.5, md: 4 },
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(15, 11, 22, 0.7)' : '#F9F8FC',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(93, 26, 137, 0.06)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient Radial Spotlight */}
            <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${currentStage.color}18 0%, transparent 70%)`,
                filter: 'blur(50px)',
                pointerEvents: 'none',
              }}
            />

            {/* Left: Detailed Stage Story */}
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '13px',
                    backgroundImage: currentStage.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: `0 8px 20px -4px ${currentStage.color}50`,
                  }}
                >
                  {currentStage.icon}
                </Box>
                <Chip
                  label={currentStage.badge}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    bgcolor: `${currentStage.color}15`,
                    color: currentStage.color,
                    border: `1px solid ${currentStage.color}35`,
                  }}
                />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 850,
                  fontSize: { xs: '1.5rem', sm: '1.85rem' },
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  mb: 1.5,
                  letterSpacing: '-0.02em',
                }}
              >
                {currentStage.title}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.72)' : 'text.secondary',
                  fontSize: '0.96rem',
                  lineHeight: 1.7,
                  mb: 3,
                }}
              >
                {currentStage.description}
              </Typography>

              {/* Verified Checklist */}
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'text.secondary',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 1.5,
                }}
              >
                AUTONOMOUS SYSTEM ACTIONS
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2 }}>
                {currentStage.highlightFeatures.map((feat, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: currentStage.color }} />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.82rem',
                        fontWeight: 650,
                        color: isDark ? '#E5E0EE' : tokens.text.primary,
                      }}
                    >
                      {feat}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right: Live Telemetry & Metrics Pane */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 2.5,
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(25, 20, 35, 0.8)' : '#FFFFFF',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 10px 25px rgba(93, 26, 137, 0.05)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'text.secondary',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 2,
                  }}
                >
                  REAL-TIME PIPELINE METRICS
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {currentStage.metrics.map((metric, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1.6,
                        borderRadius: '12px',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9F8FC',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary', fontWeight: 650, fontSize: '0.8rem' }}>
                        {metric.label}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 850, color: currentStage.color, fontSize: '0.88rem' }}>
                        {metric.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Next Stage Scrubber Controller */}
              <Box
                sx={{
                  pt: 2,
                  borderTop: '1px solid',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary', fontWeight: 600 }}>
                  Stage {activeStage + 1} of 4
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setActiveStage((prev) => (prev + 1) % STAGES.length)}
                  sx={{
                    borderRadius: '8px',
                    borderColor: currentStage.color,
                    color: currentStage.color,
                    fontWeight: 750,
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: `${currentStage.color}15`,
                      borderColor: currentStage.color,
                    },
                  }}
                >
                  {activeStage === 3 ? 'Loop to Start' : 'Next Stage'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
        </ScrollReveal>

        {/* ========================================================================= */}
        {/* PART 2: THE DISJOINTED STACK VS. LEAPSOFTS UNIFIED OS + ROI CALCULATOR   */}
        {/* ========================================================================= */}
        <ScrollReveal variant="fade-up" delay={150} duration={0.85}>
          <Box
            sx={{
              borderRadius: '24px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(255, 255, 255, 0.55)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.08)',
            boxShadow: isDark
              ? '0 20px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 20px 50px -15px rgba(93, 26, 137, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            p: { xs: 3, sm: 4, md: 5 },
            position: 'relative',
            overflow: 'hidden',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #10B981, #FFFFFF, #10B981, transparent)',
              animation: 'shimmerSweep 5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              willChange: 'transform',
              pointerEvents: 'none',
            },
          }}
        >
          {/* Subheader */}
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              <Chip
                icon={<SavingsOutlinedIcon sx={{ fontSize: 15, color: '#10B981' }} />}
                label="Why Modern Enterprises Switch"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 850,
                  fontSize: { xs: '1.75rem', sm: '2.3rem', md: '2.6rem' },
                  letterSpacing: '-0.025em',
                  background: isDark
                    ? 'linear-gradient(135deg, #FFFFFF 25%, #34D399 65%, #38BDF8 100%)'
                    : 'linear-gradient(135deg, #14111B 25%, #059669 65%, #0284C7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                The 5-Tool Fragmented Stack vs. Leapsofts
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary',
                fontSize: '1rem',
                maxWidth: '650px',
                mx: 'auto',
              }}
            >
              Stop paying 5 different subscriptions, managing 5 different passwords, and praying that third-party sync integrations don’t drop client contracts.
            </Typography>
          </Box>

          {/* Side-by-Side Comparison Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              mb: 0,
            }}
          >
            {/* Left: The Legacy Fragmented Nightmare */}
            <Box
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: '18px',
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.03)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CloseIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#EF4444' }}>
                    Fragmented 5-Tool Stack
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary' }}>
                    CRM + Jira + QuickBooks + Slack + Hubstaff
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  'Cost: ~$120 to $160 / user / month across 5 vendors',
                  '5 separate accounts, passwords, and permissions to maintain',
                  'Constant Zapier and webhook sync failures during handoffs',
                  'Hours wasted weekly re-typing lead data into project boards',
                  'Siloed employee shift and attendance logs disconnected from tasks',
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                    <CloseIcon sx={{ fontSize: 16, color: '#EF4444', mt: 0.3, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.75)' : tokens.text.primary, fontSize: '0.84rem' }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right: Leapsofts Unified ERP Engine */}
            <Box
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: '18px',
                bgcolor: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.04)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundImage: `linear-gradient(135deg, ${tokens.brand.primary}, ${tokens.brand.primaryLight})`,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#10B981' }}>
                    Leapsofts Unified OS
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary' }}>
                    Single Shared Data Spine · Zero Latency
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  'Cost: Fixed enterprise pricing — saves ~75% to 80% immediately',
                  '1 single login: Sales, Delivery, HR, Chat, and Billing in harmony',
                  'Instant 1-click lead to Kanban project board dispatch',
                  'Consent-verified shift telemetry linked to project deliverables',
                  'Direct SMTP multi-currency invoicing without third-party gateways',
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981', mt: 0.3, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : tokens.text.primary, fontWeight: 650, fontSize: '0.84rem' }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
        </ScrollReveal>
      </Container>
    </Box>
  );
};
