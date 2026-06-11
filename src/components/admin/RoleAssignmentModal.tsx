import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
  Typography,
  useTheme,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { useUpdateUser } from '@/hooks/api/useUsers';
import { ROLES } from '@/lib/constants';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type { User } from '@/types';

interface RoleAssignmentModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export const RoleAssignmentModal = ({ user, open, onClose }: RoleAssignmentModalProps) => {
  const [role, setRole] = useState<any>(ROLES.USER);
  const [googleSheetId, setGoogleSheetId] = useState('');
  const updateUser = useUpdateUser();
  const addToast = useUIStore((s) => s.addToast);
  
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setRole(user.role || ROLES.USER);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setRole(user.role || ROLES.USER);
      setGoogleSheetId(user.googleSheetId || '');
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    updateUser.mutate(
      {
        id: user._id,
        data: { role, googleSheetId },
      },
      {
        onSuccess: () => {
          addToast({ message: 'User updated successfully', severity: 'success' });
          onClose();
        },
        onError: (err: any) => {
          addToast({
            message: err.response?.data?.message || 'Failed to update user',
            severity: 'error',
          });
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDarkMode ? '#1c1825' : '#fff',
          backgroundImage: 'none',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : tokens.surface.border}`,
          p: 1.5,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: 2, px: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
          Edit User Settings
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Configure system permission level and data source for <strong>{user?.email}</strong>.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            select
            fullWidth
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            sx={{
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
            }}
          >
            <MenuItem value={ROLES.ADMIN}>Admin</MenuItem>
            <MenuItem value={ROLES.USER}>User</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Google Sheet ID"
            value={googleSheetId}
            onChange={(e) => setGoogleSheetId(e.target.value)}
            placeholder="Spreadsheet ID or URL"
            helperText="Provide the user's specific Google Sheet ID for automated syncing."
            sx={{
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
              '& .MuiFormHelperText-root': {
                fontSize: '0.72rem',
                color: 'text.secondary',
                mt: 0.5,
                px: 1,
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ gap: 1, px: 3, pb: 2, pt: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.86rem',
            px: 3,
            py: 1,
            borderRadius: '12px',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={updateUser.isPending}
          sx={{
            bgcolor: '#d95236',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.86rem',
            px: 4,
            py: 1,
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
          {updateUser.isPending ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
