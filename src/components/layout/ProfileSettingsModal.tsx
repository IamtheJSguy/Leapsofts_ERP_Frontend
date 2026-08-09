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
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

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
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  const handleSave = () => {
    updateProfile.mutate(
      { firstName, lastName },
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

  const handleConfirmSync = () => {
    setIsSyncConfirmOpen(false);
    syncMySheet.mutate(undefined, {
      onSuccess: () => {
        addToast({ message: 'Google Sheet synchronized successfully!', severity: 'success' });
      },
      onError: (err: any) => {
        addToast({
          message: err.response?.data?.message || 'Failed to trigger sync',
          severity: 'error',
        });
      },
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Profile Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update your personal details. Google Sheet sync is available when a sheet is connected.
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
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Lead Synchronization
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Trigger an on-demand sync of your connected sheet.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setIsSyncConfirmOpen(true)}
                  disabled={syncMySheet.isPending || updateProfile.isPending}
                  size="small"
                >
                  {syncMySheet.isPending ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  Sync
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

      <ConfirmDialog
        open={isSyncConfirmOpen}
        title="Sync Google Sheet?"
        message="Warning: Syncing may overwrite data that was updated in the system. Any changes made here that are not reflected in your Google Sheet can be lost. Do you want to proceed?"
        confirmLabel="Yes, Sync"
        cancelLabel="Cancel"
        isPending={syncMySheet.isPending}
        onConfirm={handleConfirmSync}
        onCancel={() => setIsSyncConfirmOpen(false)}
      />
    </>
  );
};
