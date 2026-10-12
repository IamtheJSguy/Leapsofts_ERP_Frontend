import { useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { CosmicStarfieldBackground } from '@/components/home/CosmicStarfieldBackground';
import { EnterpriseDoodleBackground } from '@/components/home/EnterpriseDoodleBackground';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { pathname } = useLocation();

  // Instantly scroll to top whenever the public route changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        bgcolor: isDark ? '#090710' : '#FAF8FD',
        color: isDark ? '#FFFFFF' : '#1A1625',
        overflowX: 'clip',
      }}
    >
      {/* Full-Page Interactive Cosmic Starfield & Nebula Gradients */}
      <CosmicStarfieldBackground />

      {/* WhatsApp-Style Enterprise Doodle Pattern Background */}
      <EnterpriseDoodleBackground />

      {/* Top Navigation */}
      <PublicNavbar />

      {/* Page Viewport */}
      <Box
        component="main"
        sx={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          pt: { xs: 12, sm: 14, md: 16 },
        }}
      >
        {children}
      </Box>

      {/* Global Footer */}
      <PublicFooter />
    </Box>
  );
};
