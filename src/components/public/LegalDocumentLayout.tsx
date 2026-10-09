import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { tokens } from '@/styles/tokens';

interface TocItem {
  id: string;
  title: string;
}

interface LegalDocumentLayoutProps {
  title: string;
  subtitle: string;
  version: string;
  lastUpdated: string;
  toc: TocItem[];
  children: React.ReactNode;
}

export const LegalDocumentLayout = ({
  title,
  subtitle,
  version,
  lastUpdated,
  toc,
  children,
}: LegalDocumentLayoutProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeSection, setActiveSection] = useState(toc[0]?.id || '');

  // 1. Instant scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // 2. High-performance, zero-jank IntersectionObserver (90-120 FPS buttery smooth scrolling)
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Track the topmost intersecting entry
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: '-80px 0px -65% 0px',
        threshold: 0,
      }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      setActiveSection(id);
      const topOffset = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({
        top: topOffset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <PublicLayout>
      <Box sx={{ pb: { xs: 8, md: 14 } }}>
        <Container maxWidth="lg">
          {/* Back link */}
          <Box sx={{ mb: 3 }}>
            <Button
              component={Link}
              to="/"
              startIcon={<ArrowBackIcon />}
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                borderRadius: '10px',
                '&:hover': {
                  color: isDark ? '#fff' : tokens.brand.primary,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(93, 26, 137, 0.05)',
                },
              }}
            >
              Back to Homepage
            </Button>
          </Box>

          {/* Document Header Banner */}
          <Box
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(25, 21, 33, 0.65)' : '#FFFFFF',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.08)',
              boxShadow: isDark ? '0 10px 40px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(93, 26, 137, 0.04)',
              mb: 5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`Version ${version}`}
                size="small"
                sx={{ bgcolor: tokens.brand.primary50, color: tokens.brand.primary, fontWeight: 750 }}
              />
              <Chip
                label={`Last Updated: ${lastUpdated}`}
                size="small"
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  color: isDark ? 'rgba(255, 255, 255, 0.75)' : 'text.secondary',
                  fontWeight: 650,
                }}
              />
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 850,
                letterSpacing: '-0.03em',
                color: isDark ? '#FFFFFF' : tokens.text.primary,
                fontSize: { xs: '1.8rem', sm: '2.5rem' },
                mb: 1,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                fontSize: '1rem',
                maxWidth: '780px',
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          {/* Two-Column Reader: Sticky Sidebar TOC + Content Viewport */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
              gap: 5,
              alignItems: 'start',
            }}
          >
            {/* Sticky Table of Contents */}
            <Box
              sx={{
                position: { xs: 'relative', md: 'sticky' },
                top: { md: 100 },
                p: 2.5,
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(25, 21, 33, 0.5)' : '#FFFFFF',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                display: { xs: 'none', md: 'block' },
                contain: 'layout style',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'text.secondary',
                  mb: 1.5,
                  display: 'block',
                }}
              >
                Table of Contents
              </Typography>

              <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {toc.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <ListItem key={item.id} disablePadding>
                      <ListItemButton
                        onClick={() => scrollToSection(item.id)}
                        sx={{
                          borderRadius: '10px',
                          py: 0.75,
                          px: 1.5,
                          bgcolor: isActive
                            ? isDark
                              ? 'rgba(93, 26, 137, 0.25)'
                              : tokens.brand.primary50
                            : 'transparent',
                          color: isActive
                            ? tokens.brand.primary
                            : isDark
                              ? 'rgba(255, 255, 255, 0.7)'
                              : 'text.secondary',
                          borderLeft: isActive ? `3px solid ${tokens.brand.accent}` : '3px solid transparent',
                          transition: 'background-color 0.15s ease, color 0.15s ease',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(93, 26, 137, 0.05)',
                          },
                        }}
                      >
                        <ListItemText
                          primary={item.title}
                          primaryTypographyProps={{
                            fontWeight: isActive ? 750 : 500,
                            fontSize: '0.84rem',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>

            {/* Main Content Body */}
            <Box
              sx={{
                contain: 'layout style',
                '& h2': {
                  fontWeight: 850,
                  fontSize: '1.6rem',
                  letterSpacing: '-0.025em',
                  mt: 5,
                  mb: 2,
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  scrollMarginTop: '110px',
                },
                '& h3': {
                  fontWeight: 750,
                  fontSize: '1.2rem',
                  mt: 3,
                  mb: 1.5,
                  color: isDark ? '#E9D5FF' : tokens.brand.primaryDark,
                },
                '& p': {
                  color: isDark ? 'rgba(255, 255, 255, 0.78)' : '#332E3F',
                  lineHeight: 1.75,
                  fontSize: '0.96rem',
                  mb: 2,
                },
                '& ul': {
                  mb: 2.5,
                  pl: 3,
                  color: isDark ? 'rgba(255, 255, 255, 0.78)' : '#332E3F',
                  lineHeight: 1.7,
                  fontSize: '0.94rem',
                },
                '& li': {
                  mb: 0.75,
                },
              }}
            >
              {children}
            </Box>
          </Box>
        </Container>
      </Box>
    </PublicLayout>
  );
};
