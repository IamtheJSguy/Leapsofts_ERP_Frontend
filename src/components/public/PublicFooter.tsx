import { Box, Typography, Grid, Link as MuiLink, Container, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { tokens } from '@/styles/tokens';

export const PublicFooter = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        bgcolor: isDark ? '#0D0B12' : '#F7F5FA',
        borderTop: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(93, 26, 137, 0.08)',
        pt: { xs: 8, md: 10 },
        pb: 6,
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting orb (Shader radial gradient without CPU blur pass) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '-150px',
          left: '50%',
          transform: 'translate3d(-50%, 0, 0)',
          width: '800px',
          height: '350px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(93, 26, 137, 0.25) 0%, rgba(255, 127, 17, 0.08) 50%, transparent 75%)`,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 5, md: 6 }}>
          {/* Brand Info & Mission */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                component="img"
                src="/logo/leapsofts.png"
                alt="Leapsofts"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  objectFit: 'contain',
                  boxShadow: '0 4px 16px rgba(93, 26, 137, 0.3)',
                }}
              />
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 850,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    color: isDark ? '#FFFFFF' : tokens.text.primary,
                  }}
                >
                  LEAPSOFTS ERP
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'text.secondary', fontWeight: 600 }}>
                  Enterprise Operating System
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary',
                lineHeight: 1.65,
                mb: 3,
                maxWidth: 340,
                fontSize: '0.88rem',
              }}
            >
              The all-in-one platform unifying customer acquisition, multi-currency invoicing, departmental Kanban boards, and workforce productivity telemetry.
            </Typography>

            {/* Live Service Status Indicator */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.75,
                py: 0.75,
                borderRadius: '999px',
                bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.35)',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#10B981',
                  boxShadow: '0 0 10px #10B981',
                  animation: 'pulse 2s infinite',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#A7F3D0' : '#065F46',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  letterSpacing: '0.02em',
                }}
              >
                All Systems Operational · 99.9% Uptime
              </Typography>
            </Box>
          </Grid>

          {/* Product Modules */}
          <Grid item xs={6} sm={4} md={2.5}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: isDark ? '#FFFFFF' : tokens.text.primary,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: '0.76rem',
                mb: 2.25,
              }}
            >
              Platform Modules
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {[
                { label: 'Sales & CRM Pipeline', href: '#features' },
                { label: 'Invoicing Studio (5 Styles)', href: '#features' },
                { label: 'Departmental Kanban', href: '#features' },
                { label: 'Workforce Attendance', href: '#features' },
                { label: 'Realtime Team Chat', href: '#features' },
                { label: 'Executive Analytics', href: '#features' },
              ].map((item) => (
                <MuiLink
                  key={item.label}
                  href={item.href}
                  underline="none"
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
                    fontSize: '0.84rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: isDark ? '#FFFFFF' : tokens.brand.primary,
                      transform: 'translateX(3px)',
                    },
                  }}
                >
                  {item.label}
                </MuiLink>
              ))}
            </Box>
          </Grid>

          {/* Solutions & Capabilities */}
          <Grid item xs={6} sm={4} md={2.5}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: isDark ? '#FFFFFF' : tokens.text.primary,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: '0.76rem',
                mb: 2.25,
              }}
            >
              Capabilities
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {[
                { label: 'LinkedIn & Cold Calling Outbound', href: '#bento-solutions' },
                { label: 'Multi-Currency Payments', href: '#bento-solutions' },
                { label: 'Automated KPI Attribution', href: '#bento-solutions' },
                { label: 'Desktop Activity Telemetry', href: '#bento-solutions' },
                { label: 'Google Drive File Hub', href: '#bento-solutions' },
                { label: 'Multi-Tenant Organizations', href: '#bento-solutions' },
              ].map((item) => (
                <MuiLink
                  key={item.label}
                  href={item.href}
                  underline="none"
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
                    fontSize: '0.84rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: isDark ? '#FFFFFF' : tokens.brand.primary,
                      transform: 'translateX(3px)',
                    },
                  }}
                >
                  {item.label}
                </MuiLink>
              ))}
            </Box>
          </Grid>

          {/* Legal & Compliance */}
          <Grid item xs={12} sm={4} md={3}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: isDark ? '#FFFFFF' : tokens.text.primary,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: '0.76rem',
                mb: 2.25,
              }}
            >
              Legal & Compliance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 3 }}>
              {[
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Workforce Monitoring Policy', path: '/security' },
                { label: 'Google API Disclosure', path: '/privacy#google-api' },
              ].map((item) => (
                <MuiLink
                  key={item.label}
                  component={Link}
                  to={item.path}
                  underline="none"
                  sx={{
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
                    fontSize: '0.84rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: isDark ? '#FFFFFF' : tokens.brand.primary,
                      transform: 'translateX(3px)',
                    },
                  }}
                >
                  {item.label}
                </MuiLink>
              ))}
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <SecurityOutlinedIcon sx={{ fontSize: 16, color: tokens.brand.accent }} />
                <Typography variant="caption" fontWeight={700} color={isDark ? '#fff' : tokens.text.primary}>
                  Enterprise Grade Security
                </Typography>
              </Box>
              <Typography variant="caption" color={isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary'} display="block" fontSize="0.72rem">
                2FA/TOTP enforced, TLS 1.3 encryption, and GDPR compliant telemetry consent.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Bottom Bar */}
        <Box
          sx={{
            mt: { xs: 6, md: 8 },
            pt: 3,
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'text.secondary',
              fontSize: '0.78rem',
            }}
          >
            © {new Date().getFullYear()} Leapsofts ERP Inc. All rights reserved.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <MuiLink
              component={Link}
              to="/privacy"
              underline="none"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'text.secondary',
                fontSize: '0.78rem',
                '&:hover': { color: isDark ? '#fff' : tokens.brand.primary },
              }}
            >
              Privacy
            </MuiLink>
            <MuiLink
              component={Link}
              to="/terms"
              underline="none"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'text.secondary',
                fontSize: '0.78rem',
                '&:hover': { color: isDark ? '#fff' : tokens.brand.primary },
              }}
            >
              Terms
            </MuiLink>
            <MuiLink
              component={Link}
              to="/login"
              underline="none"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'text.secondary',
                fontSize: '0.78rem',
                '&:hover': { color: isDark ? '#fff' : tokens.brand.primary },
              }}
            >
              Portal Sign In
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
