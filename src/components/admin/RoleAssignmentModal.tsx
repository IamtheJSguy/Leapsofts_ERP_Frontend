import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useUpdateUser } from '@/hooks/api/useUsers';
import { ROLES } from '@/lib/constants';
import { useUIStore } from '@/store/useUIStore';
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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit User — {user?.email}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
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
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={updateUser.isPending}>
          {updateUser.isPending ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
