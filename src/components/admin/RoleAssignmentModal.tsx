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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { useUpdateRole } from '@/hooks/api/useUsers';
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
  const [role, setRole] = useState(user?.role || ROLES.USER);
  const updateRole = useUpdateRole();
  const addToast = useUIStore((s) => s.addToast);
  
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setRole(user.role || ROLES.USER);
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    updateRole.mutate(
      { id: user._id, role },
      {
        onSuccess: () => {
          addToast({ message: 'User role updated successfully', severity: 'success' });
          onClose();
        },
        onError: () => {
          addToast({ message: 'Failed to update user role.', severity: 'error' });
        }
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
          Assign Role
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
          Configure system permission level for <strong>{user?.email}</strong>.
        </Typography>

        <TextField
          select
          fullWidth
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
          sx={{
            mb: 1,
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
          disabled={updateRole.isPending}
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
          {updateRole.isPending ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save Role'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
