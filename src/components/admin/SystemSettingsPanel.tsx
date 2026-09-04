import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Paper,
  useTheme,
  Divider,
  Switch,
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
  useSystemSettings,
  useUpdateSystemSettings,
} from '@/hooks/api/useSettings';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

export const SystemSettingsPanel = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const addToast = useUIStore((s) => s.addToast);
  const [dailyReportEnabled, setDailyReportEnabled] = useState(false);
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    if (settings) {
      setDailyReportEnabled(settings.automatedUserReportSchedule?.daily ?? false);
      setWeeklyReportEnabled(settings.automatedUserReportSchedule?.weekly ?? true);
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
        automatedUserReportSchedule: {
          daily: dailyReportEnabled,
          weekly: weeklyReportEnabled,
        },
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
        border: `1px solid ${isDarkMode ? `color-mix(in srgb, #fff 5%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 5%, transparent)`}`,
        bgcolor: isDarkMode ? `color-mix(in srgb, #121212 60%, transparent)` : '#ffffff',
        /* backdropFilter: 'blur(20px)' (removed for performance) */
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
          background: `radial-gradient(circle, ${`color-mix(in srgb, ${tokens.brand.primary} 12%, transparent)`} 0%, transparent 70%)`,
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
              bgcolor: isDarkMode ? `color-mix(in srgb, ${tokens.brand.primary} 15%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 8%, transparent)`,
              color: tokens.brand.primary,
              boxShadow: `inset 0 2px 10px ${`color-mix(in srgb, ${tokens.brand.primary} 10%, transparent)`}`,
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
              Manage security policies and automated report settings.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: isDarkMode ? `color-mix(in srgb, #fff 5%, transparent)` : `color-mix(in srgb, #000 5%, transparent)` }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                Automated User Reports
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, fontSize: '0.8rem' }}>
                Schedule team user-detail reports delivered at 8:00 AM via in-app notification and email (when enabled in profile settings).
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: '16px', bgcolor: isDarkMode ? `color-mix(in srgb, #fff 2%, transparent)` : `color-mix(in srgb, #000 2%, transparent)` }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Send daily user detail report</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Previous calendar day, every morning at 8 AM.</Typography>
                  </Box>
                  <Switch
                    color="primary"
                    checked={dailyReportEnabled}
                    onChange={(e) => setDailyReportEnabled(e.target.checked)}
                    disabled={readOnly}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: '16px', bgcolor: isDarkMode ? `color-mix(in srgb, #fff 2%, transparent)` : `color-mix(in srgb, #000 2%, transparent)` }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Send weekly user detail report</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Previous 7 days ending yesterday, every Monday at 8 AM.</Typography>
                  </Box>
                  <Switch
                    color="primary"
                    checked={weeklyReportEnabled}
                    onChange={(e) => setWeeklyReportEnabled(e.target.checked)}
                    disabled={readOnly}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {!readOnly && (
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
              boxShadow: `0 8px 24px ${`color-mix(in srgb, ${tokens.brand.primary} 25%, transparent)`}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                transform: 'translateY(-2px)',
                boxShadow: `0 12px 30px ${`color-mix(in srgb, ${tokens.brand.primary} 35%, transparent)`}`,
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&.Mui-disabled': {
                bgcolor: `color-mix(in srgb, ${tokens.brand.primary} 50%, transparent)`,
                color: `color-mix(in srgb, #fff 70%, transparent)`,
              }
            }}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
        )}
      </Box>
    </Paper>
  );
};
