import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Paper,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/api/useSettings';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

export const SystemSettingsPanel = () => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const addToast = useUIStore((s) => s.addToast);
  const [retentionMonths, setRetentionMonths] = useState('12');

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    if (settings) {
      setRetentionMonths(String(settings.chatRetentionMonths ?? 12));
    }
  }, [settings]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  const handleSave = () => {
    updateSettings.mutate(
      {
        chatRetentionMonths: Number(retentionMonths) || 12,
      },
      {
        onSuccess: () => addToast({ message: 'Settings saved successfully!', severity: 'success' }),
        onError: () => addToast({ message: 'Failed to save settings.', severity: 'error' }),
      },
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: '28px',
        border: `1px solid ${isDarkMode ? alpha('#fff', 0.05) : alpha(tokens.brand.primary, 0.05)}`,
        bgcolor: isDarkMode ? alpha('#121212', 0.6) : '#ffffff',
        backdropFilter: 'blur(20px)',
        boxShadow: isDarkMode 
          ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
          : '0 12px 40px rgba(93, 26, 137, 0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient decorative blob */}
      <Box 
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(tokens.brand.primary, 0.12)} 0%, transparent 70%)`,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: '16px',
              bgcolor: isDarkMode ? alpha(tokens.brand.primary, 0.15) : alpha(tokens.brand.primary, 0.08),
              color: tokens.brand.primary,
              boxShadow: `inset 0 2px 10px ${alpha(tokens.brand.primary, 0.1)}`,
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: isDarkMode ? '#fff' : tokens.text.primary,
                mb: 0.25,
              }}
            >
              System Configuration
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              Manage security policies and data retention settings.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: isDarkMode ? alpha('#fff', 0.05) : alpha('#000', 0.05) }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                Chat Retention Duration
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, fontSize: '0.8rem' }}>
                Set the number of months to keep chat history across the application before it is automatically deleted.
              </Typography>
              
              <TextField
                label="Months"
                type="number"
                fullWidth
                value={retentionMonths}
                onChange={(e) => setRetentionMonths(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    bgcolor: isDarkMode ? alpha('#fff', 0.02) : alpha('#000', 0.02),
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(tokens.brand.primary, 0.3),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: tokens.brand.primary,
                      borderWidth: '2px',
                    },
                    '&.Mui-focused': {
                      bgcolor: isDarkMode ? alpha(tokens.brand.primary, 0.05) : '#fff',
                      boxShadow: `0 4px 20px ${alpha(tokens.brand.primary, 0.1)}`,
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    '&.Mui-focused': {
                      color: tokens.brand.primary,
                    }
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updateSettings.isPending}
            startIcon={updateSettings.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.92rem',
              px: 4.5,
              py: 1.5,
              borderRadius: '16px',
              textTransform: 'none',
              boxShadow: `0 8px 24px ${alpha(tokens.brand.primary, 0.25)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                transform: 'translateY(-2px)',
                boxShadow: `0 12px 30px ${alpha(tokens.brand.primary, 0.35)}`,
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&.Mui-disabled': {
                bgcolor: alpha(tokens.brand.primary, 0.5),
                color: alpha('#fff', 0.7),
              }
            }}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
