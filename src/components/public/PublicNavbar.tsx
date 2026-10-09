import { useState, useEffect, useRef } from 'react';
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
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

const DRAWER_LINKS = [
  { label: 'Platform & Velocity', href: '#features' },
  { label: 'Interactive ERP Demo', href: '#interactive-demo' },
  { label: 'Architecture & Solutions', href: '#bento-solutions' },
  { label: 'Security & Telemetry', href: '#security' },
  { label: 'Privacy Policy', href: '/privacy', isRoute: true },
  { label: 'Terms of Service', href: '/terms', isRoute: true },
];

export const PublicNavbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentTheme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const toggleTheme = () => setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  const isDark = theme.palette.mode === 'dark';

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isPastThreshold = window.scrollY > 20;
          if (isPastThreshold !== scrolledRef.current) {
            scrolledRef.current = isPastThreshold;
            setScrolled(isPastThreshold);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDrawerLinkClick = (item: (typeof DRAWER_LINKS)[0]) => {
    setDrawerOpen(false);
    if (item.isRoute) {
      navigate(item.href);
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
        width: '100%',
        zIndex: 1100,
        transition: 'padding 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        py: scrolled ? { xs: 1.4, md: 1.6 } : { xs: 2.2, md: 2.75 },
        px: { xs: 3, sm: 5, md: 8, lg: 12, xl: 16 },
        bgcolor: 'transparent',
        borderBottom: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >


      {/* Left: Brand Identity */}
      <Box
        component={Link}
        to="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.4,
          textDecoration: 'none',
          outline: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.25s ease',
          '&:hover .brand-logo-pod': {
            transform: 'scale(1.05)',
            boxShadow: isDark
              ? '0 6px 20px rgba(168, 85, 247, 0.4), 0 0 30px rgba(255, 127, 17, 0.2)'
              : '0 6px 20px rgba(93, 26, 137, 0.25), 0 0 25px rgba(255, 127, 17, 0.15)',
            borderColor: isDark ? 'rgba(192, 132, 252, 0.55)' : 'rgba(93, 26, 137, 0.35)',
          },
          '&:hover .brand-logo-ambient': {
            opacity: 0.9,
            transform: 'scale(1.15)',
          },
          '&:hover .brand-name-softs': {
            filter: 'brightness(1.15)',
          },
        }}
      >
        {/* Logo Container with Ambient Backglow */}
        <Box sx={{ position: 'relative', width: { xs: 44, sm: 48 }, height: { xs: 44, sm: 48 } }}>
          {/* Ambient Radial Flare */}
          <Box
            className="brand-logo-ambient"
            sx={{
              position: 'absolute',
              inset: -5,
              borderRadius: '18px',
              background: isDark
                ? 'radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(255, 127, 17, 0.2) 60%, transparent 80%)'
                : 'radial-gradient(circle, rgba(93, 26, 137, 0.3) 0%, rgba(255, 127, 17, 0.15) 60%, transparent 80%)',
              filter: 'blur(10px)',
              opacity: 0.45,
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              pointerEvents: 'none',
            }}
          />

          <Box
            className="brand-logo-pod"
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '14px',
              p: '3px',
              background: isDark
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.28), rgba(255, 127, 17, 0.18))'
                : 'linear-gradient(135deg, rgba(93, 26, 137, 0.16), rgba(255, 127, 17, 0.12))',
              border: '1px solid',
              borderColor: isDark ? 'rgba(192, 132, 252, 0.35)' : 'rgba(93, 26, 137, 0.2)',
              boxShadow: isDark
                ? '0 4px 16px rgba(168, 85, 247, 0.28)'
                : '0 4px 16px rgba(93, 26, 137, 0.15)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <Box
              component="img"
              src={isDark ? '/logo/leapsofts-white.png' : '/logo/leapsofts.png'}
              alt="Leapsofts"
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '10.5px',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Box>

        {/* Company Name & Enterprise Tag */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
            <Typography
              component="span"
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 900,
                fontSize: { xs: '1.18rem', sm: '1.28rem' },
                letterSpacing: '-0.035em',
                lineHeight: 1.15,
                display: 'inline-flex',
                alignItems: 'baseline',
              }}
            >
              {/* Dual-Tone: "Leap" in high-contrast solid */}
              <Box
                component="span"
                sx={{
                  color: isDark ? '#FFFFFF' : '#1A1625',
                  transition: 'color 0.2s ease',
                }}
              >
                Leap
              </Box>
              {/* "softs" in electric purple-violet vibrant gradient */}
              <Box
                component="span"
                className="brand-name-softs"
                sx={{
                  background: isDark
                    ? 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #E879F9 100%)'
                    : 'linear-gradient(135deg, #7B3DA8 0%, #9333EA 55%, #C026D3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  transition: 'filter 0.25s ease',
                }}
              >
                softs
              </Box>
              {/* Golden-amber glowing dot */}
              <Box
                component="span"
                sx={{
                  color: '#FF7F11',
                  textShadow: '0 0 8px rgba(255, 127, 17, 0.8)',
                  ml: '1px',
                }}
              >
                .
              </Box>
            </Typography>

            {/* Frosted Glassmorphic ERP Pill */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.45,
                px: 0.75,
                py: 0.18,
                borderRadius: '999px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(255, 127, 17, 0.18) 0%, rgba(168, 85, 247, 0.16) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 127, 17, 0.12) 0%, rgba(93, 26, 137, 0.1) 100%)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 127, 17, 0.35)' : 'rgba(255, 127, 17, 0.28)',
                boxShadow: isDark
                  ? '0 2px 8px rgba(255, 127, 17, 0.18)'
                  : '0 2px 8px rgba(255, 127, 17, 0.12)',
                color: isDark ? '#FFA756' : '#E66D00',
                fontSize: '0.62rem',
                fontWeight: 850,
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: '#FF7F11',
                  boxShadow: '0 0 6px #FF7F11',
                }}
              />
              ERP
            </Box>
          </Box>

          {/* Subtitle with Pulsing Live Dot */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.15 }}>
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: '#10B981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.66rem',
                color: isDark ? 'rgba(255, 255, 255, 0.55)' : 'text.secondary',
                fontWeight: 650,
                letterSpacing: '0.025em',
                lineHeight: 1,
              }}
            >
              Enterprise Operating System
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right: Theme Toggle & High-Contrast CTA Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.25, sm: 1.75 },
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
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
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

        {/* Authenticated Workspace Button vs. Guest High-Contrast Pill CTA */}
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
              px: { xs: 2.2, sm: 2.75 },
              py: 0.9,
              fontSize: '0.86rem',
              fontWeight: 800,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #7B3DA8 0%, #5D1A89 60%, #461468 100%)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 18px rgba(93, 26, 137, 0.38)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '& .btn-arrow': {
                transition: 'transform 0.2s ease',
              },
              '&:hover': {
                background: 'linear-gradient(135deg, #8E4CBF 0%, #6E20A1 60%, #53187A 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 26px rgba(93, 26, 137, 0.52)',
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
            startIcon={<AutoAwesomeOutlinedIcon sx={{ fontSize: 16, color: '#FFD79E' }} />}
            endIcon={<ArrowForwardIcon className="btn-arrow" sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: '999px',
              px: { xs: 2.2, sm: 2.75 },
              py: 0.9,
              fontSize: '0.88rem',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #581C87 50%, #3B0764 100%)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: '0 4px 18px rgba(93, 26, 137, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '& .btn-arrow': {
                transition: 'transform 0.2s ease',
              },
              '&:hover': {
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6B21A8 50%, #4C1D95 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 28px rgba(124, 58, 237, 0.58), 0 0 16px rgba(168, 85, 247, 0.35)',
                '& .btn-arrow': {
                  transform: 'translateX(4px)',
                },
              },
            }}
          >
            Get Started
          </Button>
        )}

        {/* Quick Menu Drawer Hamburger */}
        {isMobile && (
          <IconButton
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation drawer"
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

      {/* Modern Frosted Drawer Menu */}
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
              ? '-20px 0 50px rgba(0, 0, 0, 0.7)'
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
              src={isDark ? '/logo/leapsofts-white.png' : '/logo/leapsofts.png'}
              alt="Leapsofts"
              sx={{
                width: 38,
                height: 38,
                borderRadius: '11px',
                border: '1px solid',
                borderColor: isDark ? 'rgba(192, 132, 252, 0.35)' : 'rgba(93, 26, 137, 0.2)',
                p: '2.5px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(255, 127, 17, 0.15))'
                  : 'linear-gradient(135deg, rgba(93, 26, 137, 0.15), rgba(255, 127, 17, 0.1))',
              }}
            />
            <Box>
              <Typography
                component="div"
                sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  letterSpacing: '-0.035em',
                  lineHeight: 1.15,
                  display: 'inline-flex',
                  alignItems: 'baseline',
                }}
              >
                <Box component="span" sx={{ color: isDark ? '#FFFFFF' : '#1A1625' }}>
                  Leap
                </Box>
                <Box
                  component="span"
                  sx={{
                    background: isDark
                      ? 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #E879F9 100%)'
                      : 'linear-gradient(135deg, #7B3DA8 0%, #9333EA 55%, #C026D3 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  softs
                </Box>
                <Box component="span" sx={{ color: '#FF7F11', ml: '1px' }}>
                  .
                </Box>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.15 }}>
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    bgcolor: '#10B981',
                    boxShadow: '0 0 6px #10B981',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.64rem',
                    color: isDark ? 'rgba(255, 255, 255, 0.55)' : 'text.secondary',
                    fontWeight: 650,
                  }}
                >
                  Enterprise Operating System
                </Typography>
              </Box>
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
          {DRAWER_LINKS.map((link) => (
            <ListItem key={link.label} disablePadding>
              <ListItemButton
                onClick={() => handleDrawerLinkClick(link)}
                sx={{
                  borderRadius: '14px',
                  py: 1.25,
                  px: 2,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    bgcolor: isDark
                      ? 'rgba(255, 127, 17, 0.12)'
                      : 'rgba(255, 127, 17, 0.08)',
                    borderColor: 'rgba(255, 127, 17, 0.35)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{
                    fontWeight: 650,
                    fontSize: '0.9rem',
                    color: isDark ? '#E8E4EF' : tokens.text.primary,
                  }}
                />
                <ChevronRightIcon
                  sx={{
                    fontSize: 18,
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
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
                background: 'linear-gradient(135deg, #7C3AED 0%, #581C87 50%, #3B0764 100%)',
                color: '#fff',
                borderRadius: '999px',
                py: 1.3,
                fontWeight: 800,
                fontSize: '0.92rem',
                textTransform: 'none',
                boxShadow: '0 6px 22px rgba(93, 26, 137, 0.45)',
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
