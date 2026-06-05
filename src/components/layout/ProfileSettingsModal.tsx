import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile, useSyncMySheet } from '@/hooks/api/useAuth';
import { useUIStore } from '@/store/useUIStore';

interface ProfileSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal = ({ open, onClose }: ProfileSettingsModalProps) => {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const syncMySheet = useSyncMySheet();
  const addToast = useUIStore((s) => s.addToast);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sheetInput, setSheetInput] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setSheetInput(user.googleSheetId || '');
    }
  }, [user]);

  const extractSheetId = (input: string) => {
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  const handleSave = () => {
    const googleSheetId = extractSheetId(sheetInput);
    updateProfile.mutate(
      { firstName, lastName, googleSheetId },
      {
        onSuccess: () => {
          addToast({ message: 'Profile updated successfully', severity: 'success' });
          onClose();
        },
        onError: (err: any) => {
          addToast({
            message: err.response?.data?.message || 'Failed to update profile',
            severity: 'error',
          });
        },
      },
    );
  };

  const handleSyncNow = () => {
    const googleSheetId = extractSheetId(sheetInput);
    if (!googleSheetId) {
      addToast({ message: 'Please configure a Google Sheet ID or URL first', severity: 'warning' });
      return;
    }

    // First save the sheet ID if it's different from the existing one, then trigger sync
    const doSync = () => {
      syncMySheet.mutate(undefined, {
        onSuccess: () => {
          addToast({ message: 'Google Sheet synchronization started', severity: 'info' });
        },
        onError: (err: any) => {
          addToast({
            message: err.response?.data?.message || 'Failed to trigger sync',
            severity: 'error',
          });
        },
      });
    };

    if (googleSheetId !== user?.googleSheetId) {
      updateProfile.mutate(
        { firstName, lastName, googleSheetId },
        {
          onSuccess: () => {
            doSync();
          },
          onError: () => {
            addToast({ message: 'Failed to update sheet ID before sync', severity: 'error' });
          },
        },
      );
    } else {
      doSync();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Profile & Sheet Settings</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Update your personal details and associate your own Google Sheet URL to automatically ingest your leads.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
            />
          </Box>

          <TextField
            label="Google Sheet URL or ID"
            value={sheetInput}
            onChange={(e) => setSheetInput(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            fullWidth
            helperText="Paste the full URL of your Google Sheet or the ID directly. Ensure the sheet is shared/accessible."
          />

          {user?.googleSheetId && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Lead Synchronization
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Trigger an on-demand sync of your sheet.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={handleSyncNow}
                disabled={syncMySheet.isPending || updateProfile.isPending}
                size="small"
              >
                {syncMySheet.isPending ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                Sync Now
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="text">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={updateProfile.isPending || syncMySheet.isPending}
        >
          {updateProfile.isPending ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
