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
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/api/useSettings';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

export const SystemSettingsPanel = () => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const addToast = useUIStore((s) => s.addToast);
  const [sheetUrl, setSheetUrl] = useState('');
  const [retentionMonths, setRetentionMonths] = useState('12');

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    if (settings) {
      setSheetUrl(settings.referenceSheetUrl || '');
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
        referenceSheetUrl: sheetUrl,
        chatRetentionMonths: Number(retentionMonths) || 12,
      },
      {
        onSuccess: () => addToast({ message: 'Settings saved successfully!', severity: 'success' }),
        onError: () => addToast({ message: 'Failed to save settings.', severity: 'error' }),
      },
    );
  };

  const textFieldSx = {
    mb: 1.5,
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px',
      bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#F9F8F7',
      fontSize: '0.88rem',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      '& fieldset': {
        borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      },
      '&:hover fieldset': {
        borderColor: tokens.brand.primaryMuted,
      },
      '&.Mui-focused fieldset': {
        borderColor: tokens.brand.primary,
        borderWidth: '1px',
      },
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.88rem',
      color: 'text.secondary',
      '&.Mui-focused': {
        color: tokens.brand.primary,
      },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: '24px',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : tokens.surface.border}`,
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.015em',
          mb: 1,
          color: isDarkMode ? '#fff' : tokens.text.primary,
        }}
      >
        System Configuration
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 4,
          fontSize: '0.86rem',
        }}
      >
        Maintain master data synchronization links, security policy durations, and sync tasks.
      </Typography>

      {/* Info Alert Box for Google Sheet Synchronization */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          p: 2.5,
          mb: 4,
          borderRadius: '16px',
          bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.08)' : 'rgba(93, 26, 137, 0.03)',
          border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.1)'}`,
        }}
      >
        <InfoOutlinedIcon sx={{ color: isDarkMode ? tokens.brand.primaryMuted : tokens.brand.primary, mt: 0.25, fontSize: 20 }} />
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.88rem',
              color: isDarkMode ? '#fff' : tokens.text.primary,
              mb: 0.5,
            }}
          >
            Twice-Daily Automated Sync
          </Typography>
          <Typography
            sx={{
              fontSize: '0.78rem',
              color: isDarkMode ? 'rgba(255,255,255,0.6)' : tokens.text.secondary,
              lineHeight: 1.5,
            }}
          >
            The sales automation engine pulls representative targets and database structures from your connected Google Sheet twice daily (06:00 and 18:00 UTC). Make sure the sheet permissions are set to public or accessible via link.
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="Reference Sheet URL"
            fullWidth
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            helperText="Google Sheets URL for representative data and operations templates"
            FormHelperTextProps={{
              sx: {
                color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'text.secondary',
                mt: 1,
                fontSize: '0.74rem',
                fontWeight: 500,
              }
            }}
            sx={textFieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Chat Retention (months)"
            type="number"
            fullWidth
            value={retentionMonths}
            onChange={(e) => setRetentionMonths(e.target.value)}
            sx={textFieldSx}
          />
        </Grid>
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updateSettings.isPending}
            sx={{
              bgcolor: '#d95236',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.86rem',
              px: 4.5,
              py: 1.25,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(217, 82, 54, 0.2)',
              textTransform: 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                bgcolor: '#c7452b',
                boxShadow: '0 6px 16px rgba(217, 82, 54, 0.3)',
              },
              '&:active': {
                transform: 'translateY(1px)',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(217, 82, 54, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
              }
            }}
          >
            {updateSettings.isPending ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save Settings'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};
