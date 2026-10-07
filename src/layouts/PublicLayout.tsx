import { Box, useTheme } from '@mui/material';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { CosmicStarfieldBackground } from '@/components/home/CosmicStarfieldBackground';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
