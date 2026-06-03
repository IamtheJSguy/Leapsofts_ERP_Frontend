import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useState } from 'react';
import { useUpdateRole } from '@/hooks/api/useUsers';
import { ROLES } from '@/lib/constants';
import { useUIStore } from '@/store/useUIStore';
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

  const handleSave = () => {
    if (!user) return;
    updateRole.mutate(
      { id: user._id, role },
      {
        onSuccess: () => {
          addToast({ message: 'Role updated', severity: 'success' });
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Assign Role — {user?.email}</DialogTitle>
      <DialogContent>
        <TextField
          select
          fullWidth
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
          sx={{ mt: 1 }}
        >
          <MenuItem value={ROLES.ADMIN}>Admin</MenuItem>
          <MenuItem value={ROLES.USER}>User</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={updateRole.isPending}>
          {updateRole.isPending ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
