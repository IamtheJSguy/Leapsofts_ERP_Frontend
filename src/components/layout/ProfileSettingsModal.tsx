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
  Avatar,
} from '@mui/material';
import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile, useSyncMySheet } from '@/hooks/api/useAuth';
import { useUploadAvatar } from '@/hooks/api/useUsers';
import { useUIStore } from '@/store/useUIStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';

interface ProfileSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal = ({ open, onClose }: ProfileSettingsModalProps) => {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const syncMySheet = useSyncMySheet();
  const addToast = useUIStore((s) => s.addToast);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast({ message: 'Please choose a JPEG, PNG, or WebP image.', severity: 'error' });
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      addToast({ message: 'Image must be 1MB or smaller.', severity: 'error' });
      return;
    }
    uploadAvatar.mutate(file, {
      onSuccess: () => {
        addToast({ message: 'Profile photo updated.', severity: 'success' });
      },
      onError: (err: any) => {
        addToast({
          message: err.response?.data?.message || 'Failed to upload profile photo',
          severity: 'error',
        });
      },
    });
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                hidden
                onChange={handleAvatarChange}
              />
              <Box
                onClick={() => avatarInputRef.current?.click()}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover .avatar-upload-overlay': { opacity: 1 },
                }}
              >
                <Avatar src={user?.avatarUrl} sx={{ width: 64, height: 64, fontWeight: 700 }}>
                  {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </Avatar>
                <Box
                  className="avatar-upload-overlay"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: uploadAvatar.isPending ? 1 : 0,
                    transition: 'opacity 0.2s',
                    color: '#fff',
                  }}
                >
                  {uploadAvatar.isPending ? (
                    <CircularProgress size={18} sx={{ color: '#fff' }} />
                  ) : (
                    <PhotoCameraOutlinedIcon sx={{ fontSize: 18 }} />
                  )}
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Profile photo
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click the photo to upload a JPEG, PNG, or WebP image (max 1MB).
                </Typography>
              </Box>
            </Box>
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
