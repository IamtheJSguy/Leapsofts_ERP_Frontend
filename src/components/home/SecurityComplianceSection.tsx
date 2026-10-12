import { Box, Typography, Container, Chip, useTheme } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import { tokens } from '@/styles/tokens';
import { ScrollReveal } from './scroll/ScrollReveal';

const SECURITY_PILLARS = [
  {
    icon: <LockOutlinedIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />,
    color: '#FF7F11',
    gradient: 'linear-gradient(135deg, #EA580C 0%, #FF7F11 100%)',
    ambientGlow: 'rgba(255, 127, 17, 0.16)',
    badge: 'TOTP / RFC 6238',
    title: 'Two-Factor Authentication (TOTP)',
    desc: 'Mandatory QR-code multi-factor authentication protects all organization accounts against unauthorized access.',
  },
  {
    icon: <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />,
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
    ambientGlow: 'rgba(168, 85, 247, 0.16)',
    badge: 'RBAC Matrix',
    title: 'Granular Role-Based Access Control',
    desc: 'Fine-tuned permission gating across Admin, Manager, and Team Member roles for leads, finance, and system settings.',
  },
  {
    icon: <VisibilityOutlinedIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />,
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    ambientGlow: 'rgba(16, 185, 129, 0.16)',
    badge: 'GDPR & Privacy',
    title: 'Transparent Workplace Consent',
    desc: 'Shift screenshots and app telemetry require explicit employee policy acknowledgment before monitoring initiates.',
  },
  {
    icon: <StorageOutlinedIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />,
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
    ambientGlow: 'rgba(99, 102, 241, 0.16)',
    badge: 'Tenant Isolation',
    title: 'Isolated Multi-Tenant Architecture',
    desc: 'Strict logical database separation between distinct corporate entities, with instantaneous organization switching.',
  },
];

export const SecurityComplianceSection = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box id="security" sx={{ py: { xs: 8, md: 14 }, bgcolor: 'transparent', position: 'relative' }}>
      <Container maxWidth="lg">
        <ScrollReveal variant="fade-up">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Chip
                label="Enterprise Trust"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  bgcolor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
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
                    ? 'linear-gradient(135deg, #FFFFFF 30%, #10B981 70%, #818CF8 100%)'
                    : 'linear-gradient(135deg, #14111B 30%, #059669 70%, #4F46E5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                Bank-Grade Security. Transparent Telemetry.
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary',
                fontSize: '1.05rem',
                maxWidth: '660px',
                mx: 'auto',
              }}
            >
              We adhere to rigorous data protection standards, ensuring full GDPR compliance and transparent workplace agreements.
            </Typography>
          </Box>
        </ScrollReveal>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
            gap: { xs: 3, lg: 3.5 },
          }}
        >
          {SECURITY_PILLARS.map((pillar, idx) => (
            <ScrollReveal
              key={idx}
              variant="scale-up"
              delay={idx * 90}
              duration={0.75}
              distance={32}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Box
                sx={{
                  height: '100%',
                  p: { xs: 3, md: 3.5 },
                  borderRadius: '24px',
                  bgcolor: isDark ? 'rgba(23, 18, 32, 0.92)' : 'rgba(255, 255, 255, 0.9)',
                  backgroundImage: isDark
                    ? `radial-gradient(circle at 15% 15%, ${pillar.ambientGlow} 0%, transparent 65%)`
                    : `radial-gradient(circle at 15% 15%, ${pillar.ambientGlow} 0%, transparent 60%)`,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.09)',
                  boxShadow: isDark
                    ? '0 16px 40px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
                    : '0 16px 40px -15px rgba(93, 26, 137, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                  // Light beam on top edge: sweeps across on hover
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '60%',
                    height: '2px',
                    background: `linear-gradient(90deg, transparent, ${pillar.color}, #FFFFFF, ${pillar.color}, transparent)`,
                    opacity: 0,
                    pointerEvents: 'none',
                    transform: 'translate3d(-100%, 0, 0)',
                    transition: 'opacity 0.2s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: pillar.color,
                    boxShadow: isDark
                      ? `0 24px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px -8px ${pillar.ambientGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                      : `0 24px 45px -12px rgba(93, 26, 137, 0.15), 0 0 30px -8px ${pillar.ambientGlow}, inset 0 1px 0 rgba(255, 255, 255, 1)`,
                    '&::after': {
                      opacity: 1,
                      animation: 'shimmerSweep 1.6s cubic-bezier(0.4, 0, 0.2, 1) 1',
                    },
                    '& .pillar-icon-badge': {
                      transform: 'scale(1.08)',
                      boxShadow: `0 8px 24px -4px ${pillar.color}70`,
                    },
                  },
                }}
            >
              {/* Header inside card: Icon badge and mini badge chip */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box
                  className="pillar-icon-badge"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    backgroundImage: pillar.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 20px -4px ${pillar.color}50`,
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {pillar.icon}
                </Box>

                <Box
                  sx={{
                    px: 1.2,
                    py: 0.4,
                    borderRadius: '8px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : `${pillar.color}12`,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : `${pillar.color}25`,
                    color: isDark ? '#FFFFFF' : pillar.color,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {pillar.badge}
                </Box>
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  letterSpacing: '-0.02em',
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  mb: 1.2,
                }}
              >
                {pillar.title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary',
                  lineHeight: 1.65,
                  fontSize: '0.88rem',
                  flexGrow: 1,
                }}
              >
                {pillar.desc}
              </Typography>
            </Box>
          </ScrollReveal>
        ))}
      </Box>
      </Container>
    </Box>
  );
};
