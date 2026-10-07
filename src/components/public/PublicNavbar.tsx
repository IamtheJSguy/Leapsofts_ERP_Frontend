import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

const NAV_LINKS = [
  { label: 'Platform', href: '#features' },
  { label: 'Interactive Demo', href: '#interactive-demo' },
  { label: 'Solutions', href: '#bento-solutions' },
  { label: 'Security & Telemetry', href: '#security' },
  { label: 'Privacy', href: '/privacy', isRoute: true },
  { label: 'Terms', href: '/terms', isRoute: true },
];

export const PublicNavbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentTheme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const toggleTheme = () => setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  const isDark = theme.palette.mode === 'dark';

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      // Calculate scroll progress percentage across the page
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollY / docHeight) * 100)));
      }

      // Track active section on homepage
      if (location.pathname === '/') {
        const sectionIds = ['security', 'bento-solutions', 'interactive-demo', 'features'];
        let matched = '';
        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.15) {
              matched = `#${id}`;
              break;
            }
          }
        }
        setActiveSection(matched);
      } else {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleNavClick = (item: (typeof NAV_LINKS)[0]) => {
    setDrawerOpen(false);
    if (item.isRoute) {
      navigate(item.href);
      return;
    }

    if (location.pathname !== '/') {
      navigate('/' + item.href);
      return;
    }

    const el = document.querySelector(item.href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const userInitial = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : 'U';

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.email || 'Active Member';

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        transition: 'padding 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        py: scrolled ? { xs: 1.25, md: 1.5 } : { xs: 2, md: 2.75 },
        px: { xs: 1.75, sm: 2.5, md: 4 },
        pointerEvents: 'none', // Allow clicks through padding area to page
      }}
    >
      <Box
        sx={{
          pointerEvents: 'auto', // Re-enable pointer events on the island pill
          maxWidth: '1240px',
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 2.75, md: 3 },
          py: scrolled ? 1 : 1.25,
          borderRadius: '999px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          bgcolor: isDark
            ? scrolled
              ? 'rgba(15, 12, 22, 0.82)'
              : 'rgba(20, 16, 30, 0.62)'
            : scrolled
              ? 'rgba(255, 255, 255, 0.88)'
              : 'rgba(255, 255, 255, 0.72)',
          border: '1px solid',
          borderColor: isDark
            ? scrolled
              ? 'rgba(192, 132, 252, 0.28)'
              : 'rgba(255, 255, 255, 0.1)'
            : scrolled
              ? 'rgba(93, 26, 137, 0.18)'
              : 'rgba(0, 0, 0, 0.08)',
          boxShadow: scrolled
            ? isDark
              ? '0 20px 48px -12px rgba(0, 0, 0, 0.75), 0 0 24px rgba(93, 26, 137, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
              : '0 16px 40px -12px rgba(93, 26, 137, 0.14), 0 2px 10px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            : isDark
              ? '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              : '0 6px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          // Crystalline illuminated beam on upper edge
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '12%',
            right: '12%',
            height: '1px',
            background: isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(192, 132, 252, 0.7) 40%, rgba(255, 127, 17, 0.5) 75%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(93, 26, 137, 0.4) 40%, rgba(255, 127, 17, 0.3) 75%, transparent 100%)',
            pointerEvents: 'none',
          },
        }}
      >
        {/* Dynamic Scroll Depth Indicator Hairline */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: '24px',
            right: '24px',
            height: '2px',
            borderRadius: '2px',
            overflow: 'hidden',
            pointerEvents: 'none',
            opacity: scrolled ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${scrollProgress}%`,
              background: 'linear-gradient(90deg, #5D1A89 0%, #C084FC 50%, #FF7F11 100%)',
              boxShadow: '0 0 10px rgba(192, 132, 252, 0.7)',
              transition: 'width 0.12s linear',
            }}
          />
        </Box>

        {/* Brand Logo & Live Status Capsule */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            textDecoration: 'none',
            outline: 'none',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '12px',
              p: '2.5px',
              background: isDark
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(255, 127, 17, 0.25))'
                : 'linear-gradient(135deg, rgba(93, 26, 137, 0.2), rgba(255, 127, 17, 0.15))',
              border: '1px solid',
              borderColor: isDark ? 'rgba(192, 132, 252, 0.35)' : 'rgba(93, 26, 137, 0.18)',
              boxShadow: isDark
                ? '0 4px 14px rgba(93, 26, 137, 0.35)'
                : '0 4px 14px rgba(93, 26, 137, 0.12)',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
              '&:hover': {
                transform: 'scale(1.06) rotate(-2deg)',
                boxShadow: '0 6px 20px rgba(168, 85, 247, 0.45)',
              },
            }}
          >
            <Box
              component="img"
              src="/logo/leapsofts.png"
              alt="Leapsofts"
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '9px',
                objectFit: 'contain',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '1.05rem', sm: '1.18rem' },
                  letterSpacing: '-0.035em',
                  background: isDark
                    ? 'linear-gradient(135deg, #FFFFFF 25%, #E9D5FF 65%, #C084FC 100%)'
                    : 'linear-gradient(135deg, #1A1625 20%, #5D1A89 75%, #7B3DA8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.15,
                }}
              >
                LEAPSOFTS
              </Typography>
              <Box
                sx={{
                  fontSize: '0.62rem',
                  fontWeight: 850,
                  px: 0.75,
                  py: 0.2,
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #FF7F11 0%, #E66A00 100%)',
                  color: '#FFFFFF',
                  letterSpacing: '0.05em',
                  lineHeight: 1.1,
                  boxShadow: '0 2px 8px rgba(255, 127, 17, 0.4)',
                  display: { xs: 'none', sm: 'inline-block' },
                }}
              >
                ERP
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  bgcolor: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.66rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.48)' : 'text.secondary',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                Enterprise Sales & Ops
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Desktop Navigation Dock (Modern Floating Pill Capsule) */}
        {!isMobile && (
          <Box
            component="nav"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.025)',
              p: '4px 6px',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {NAV_LINKS.map((link) => {
              const isActive =
                activeSection === link.href ||
                (link.isRoute && location.pathname === link.href);

              return (
                <Button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  sx={{
                    color: isActive
                      ? isDark
                        ? '#FFFFFF'
                        : tokens.brand.primary
                      : isDark
                        ? 'rgba(255, 255, 255, 0.72)'
                        : 'text.secondary',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.84rem',
                    px: 1.6,
                    py: 0.6,
                    borderRadius: '999px',
                    textTransform: 'none',
                    position: 'relative',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    bgcolor: isActive
                      ? isDark
                        ? 'rgba(168, 85, 247, 0.16)'
                        : 'rgba(93, 26, 137, 0.08)'
                      : 'transparent',
                    border: '1px solid',
                    borderColor: isActive
                      ? isDark
                        ? 'rgba(192, 132, 252, 0.35)'
                        : 'rgba(93, 26, 137, 0.22)'
                      : 'transparent',
                    boxShadow: isActive
                      ? isDark
                        ? '0 0 14px rgba(168, 85, 247, 0.25)'
                        : '0 2px 8px rgba(93, 26, 137, 0.1)'
                      : 'none',
                    '&:hover': {
                      color: isDark ? '#FFFFFF' : tokens.brand.primary,
                      bgcolor: isActive
                        ? isDark
                          ? 'rgba(168, 85, 247, 0.22)'
                          : 'rgba(93, 26, 137, 0.12)'
                        : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(93, 26, 137, 0.06)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {isActive && (
                    <Box
                      component="span"
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        bgcolor: tokens.brand.accent,
                        mr: 0.75,
                        boxShadow: '0 0 6px #FF7F11',
                        display: 'inline-block',
                      }}
                    />
                  )}
                  {link.label}
                </Button>
              );
            })}
          </Box>
        )}

        {/* Action Controls & Authentication */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Theme Toggle Button */}
          <Tooltip title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}>
            <IconButton
              size="small"
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                color: isDark ? '#F5F3F8' : '#1A1625',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                  transform: 'rotate(20deg) scale(1.05)',
                  boxShadow: isDark
                    ? '0 0 14px rgba(252, 211, 77, 0.3)'
                    : '0 2px 10px rgba(0, 0, 0, 0.08)',
                },
              }}
            >
              {isDark ? (
                <LightModeOutlinedIcon sx={{ fontSize: 18, color: '#FCD34D' }} />
              ) : (
                <DarkModeOutlinedIcon sx={{ fontSize: 18, color: '#5D1A89' }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Authenticated Workspace Button vs. Guest CTAs */}
          {isAuthenticated ? (
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
              startIcon={
                <Avatar
                  src={user?.avatarUrl}
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.72rem',
                    fontWeight: 750,
                    bgcolor: tokens.brand.primaryDark,
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {userInitial}
                </Avatar>
              }
              endIcon={<ArrowForwardIcon className="btn-arrow" sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: '999px',
                px: { xs: 1.85, sm: 2.35 },
                py: 0.8,
                fontSize: '0.84rem',
                fontWeight: 750,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #7B3DA8 0%, #5D1A89 60%, #461468 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 18px rgba(93, 26, 137, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                '& .btn-arrow': {
                  transition: 'transform 0.2s ease',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #8E4CBF 0%, #6E20A1 60%, #53187A 100%)',
                  transform: 'translateY(-1.5px)',
                  boxShadow: '0 8px 26px rgba(93, 26, 137, 0.52), 0 0 16px rgba(168, 85, 247, 0.35)',
                  '& .btn-arrow': {
                    transform: 'translateX(4px)',
                  },
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, mr: 0.5 }}>
                Launch
              </Box>
              Workspace
            </Button>
          ) : (
            <Button
              variant="contained"
              component={Link}
              to="/login"
              startIcon={<AutoAwesomeOutlinedIcon sx={{ fontSize: 15, color: '#FFD79E' }} />}
              endIcon={<ArrowForwardIcon className="btn-arrow" sx={{ fontSize: 15 }} />}
              sx={{
                borderRadius: '999px',
                px: { xs: 2, sm: 2.5 },
                py: 0.8,
                fontSize: '0.84rem',
                fontWeight: 750,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #7B3DA8 0%, #5D1A89 60%, #461468 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow: '0 4px 18px rgba(93, 26, 137, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                '& .btn-arrow': {
                  transition: 'transform 0.2s ease',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #8E4CBF 0%, #6E20A1 60%, #53187A 100%)',
                  transform: 'translateY(-1.5px)',
                  boxShadow: '0 8px 26px rgba(93, 26, 137, 0.55), 0 0 18px rgba(168, 85, 247, 0.35)',
                  '& .btn-arrow': {
                    transform: 'translateX(4px)',
                  },
                },
              }}
            >
              Get Started
            </Button>
          )}

          {/* Mobile Menu Hamburger */}
          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open mobile navigation menu"
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                color: isDark ? '#FFFFFF' : tokens.text.primary,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Modern Frosted Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: 310, sm: 340 },
            backdropFilter: 'blur(32px) saturate(190%)',
            WebkitBackdropFilter: 'blur(32px) saturate(190%)',
            bgcolor: isDark ? 'rgba(18, 14, 25, 0.94)' : 'rgba(255, 255, 255, 0.94)',
            backgroundImage: 'none',
            p: 3,
            borderLeft: '1px solid',
            borderColor: isDark ? 'rgba(192, 132, 252, 0.2)' : 'rgba(93, 26, 137, 0.12)',
            boxShadow: isDark
              ? '-20px 0 50px rgba(0, 0, 0, 0.7), -4px 0 20px rgba(93, 26, 137, 0.2)'
              : '-20px 0 50px rgba(93, 26, 137, 0.12)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2.5,
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              component="img"
              src="/logo/leapsofts.png"
              alt="Leapsofts"
              sx={{
                width: 32,
                height: 32,
                borderRadius: '9px',
                border: '1px solid',
                borderColor: isDark ? 'rgba(192, 132, 252, 0.3)' : 'rgba(93, 26, 137, 0.15)',
              }}
            />
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={850}
                sx={{
                  background: isDark
                    ? 'linear-gradient(135deg, #FFFFFF 30%, #C084FC 100%)'
                    : 'linear-gradient(135deg, #1A1625 30%, #5D1A89 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                }}
              >
                LEAPSOFTS
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.64rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary',
                  fontWeight: 600,
                }}
              >
                Enterprise Workspace
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setDrawerOpen(false)}
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              color: isDark ? '#FFFFFF' : tokens.text.primary,
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Drawer Nav Links */}
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 3, p: 0 }}>
          {NAV_LINKS.map((link) => {
            const isActive =
              activeSection === link.href ||
              (link.isRoute && location.pathname === link.href);

            return (
              <ListItem key={link.label} disablePadding>
                <ListItemButton
                  onClick={() => handleNavClick(link)}
                  sx={{
                    borderRadius: '14px',
                    py: 1.25,
                    px: 2,
                    bgcolor: isActive
                      ? isDark
                        ? 'rgba(168, 85, 247, 0.14)'
                        : 'rgba(93, 26, 137, 0.08)'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid',
                    borderColor: isActive
                      ? isDark
                        ? 'rgba(192, 132, 252, 0.35)'
                        : 'rgba(93, 26, 137, 0.22)'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      bgcolor: isDark
                        ? 'rgba(255, 255, 255, 0.07)'
                        : 'rgba(93, 26, 137, 0.05)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isActive && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: tokens.brand.accent,
                          boxShadow: '0 0 8px #FF7F11',
                        }}
                      />
                    )}
                    <ListItemText
                      primary={link.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 750 : 600,
                        fontSize: '0.92rem',
                        color: isActive
                          ? isDark
                            ? '#FFFFFF'
                            : tokens.brand.primary
                          : isDark
                            ? '#E8E4EF'
                            : tokens.text.primary,
                      }}
                    />
                  </Box>
                  <ChevronRightIcon
                    sx={{
                      fontSize: 18,
                      color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Drawer Footer Actions */}
        <Box
          sx={{
            mt: 'auto',
            pt: 3,
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {/* Quick Theme Switch Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.25,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: '0.84rem',
                color: isDark ? 'rgba(255, 255, 255, 0.75)' : tokens.text.primary,
              }}
            >
              Appearance ({isDark ? 'Dark Mode' : 'Light Mode'})
            </Typography>
            <IconButton
              size="small"
              onClick={toggleTheme}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              }}
            >
              {isDark ? (
                <LightModeOutlinedIcon sx={{ fontSize: 16, color: '#FCD34D' }} />
              ) : (
                <DarkModeOutlinedIcon sx={{ fontSize: 16, color: '#5D1A89' }} />
              )}
            </IconButton>
          </Box>

          {isAuthenticated ? (
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                setDrawerOpen(false);
                navigate('/dashboard');
              }}
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: 'linear-gradient(135deg, #7B3DA8 0%, #5D1A89 100%)',
                color: '#fff',
                py: 1.3,
                borderRadius: '14px',
                fontWeight: 750,
                textTransform: 'none',
                boxShadow: '0 6px 20px rgba(93, 26, 137, 0.4)',
              }}
            >
              Open {userName}'s Workspace
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              component={Link}
              to="/login"
              onClick={() => setDrawerOpen(false)}
              startIcon={<AutoAwesomeOutlinedIcon sx={{ fontSize: 16, color: '#FFD79E' }} />}
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: 'linear-gradient(135deg, #7B3DA8 0%, #5D1A89 100%)',
                color: '#fff',
                borderRadius: '14px',
                py: 1.25,
                fontWeight: 750,
                fontSize: '0.9rem',
                textTransform: 'none',
                boxShadow: '0 6px 20px rgba(93, 26, 137, 0.42)',
              }}
            >
              Get Started
            </Button>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

