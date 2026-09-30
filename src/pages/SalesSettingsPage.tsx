import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { SalesSettingsPanel } from '@/components/admin/SalesSettingsPanel';

const SalesSettingsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 3,
          pb: 2,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
          sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            Sales settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Add and manage ICPs and profiles used across the sales pipeline.
          </Typography>
        </Box>
      </Box>

      <SalesSettingsPanel />
    </Box>
  );
};

export default SalesSettingsPage;
