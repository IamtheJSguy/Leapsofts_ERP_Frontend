import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/api/useSettings';
import { useUIStore } from '@/store/useUIStore';

export const SystemSettingsPanel = () => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const addToast = useUIStore((s) => s.addToast);
  const [sheetUrl, setSheetUrl] = useState('');
  const [retentionMonths, setRetentionMonths] = useState('12');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleSave = () => {
    updateSettings.mutate(
      {
        referenceSheetUrl: sheetUrl || settings?.referenceSheetUrl,
        chatRetentionMonths: Number(retentionMonths) || settings?.chatRetentionMonths,
      },
      {
        onSuccess: () => addToast({ message: 'Settings saved', severity: 'success' }),
      },
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        System Settings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Reference Sheet URL"
            fullWidth
            value={sheetUrl || settings?.referenceSheetUrl || ''}
            onChange={(e) => setSheetUrl(e.target.value)}
            helperText="Google Sheets URL for twice-daily sync (06:00 & 18:00 UTC)"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Chat Retention (months)"
            type="number"
            fullWidth
            value={retentionMonths || settings?.chatRetentionMonths || 12}
            onChange={(e) => setRetentionMonths(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? <CircularProgress size={20} /> : 'Save Settings'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};
