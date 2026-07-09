import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { useCreateTeam } from '@/hooks/api/useTeam';

interface CreateTeamModalProps {
  open: boolean;
  onClose?: () => void;
}

export const CreateTeamModal = ({ open, onClose }: CreateTeamModalProps) => {
  const [name, setName] = useState('');
  const createTeam = useCreateTeam();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createTeam.mutateAsync(name.trim());
    setName('');
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Your Team</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          As a manager, create your team before managing members and viewing team analytics.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Team Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sales Team Alpha"
        />
      </DialogContent>
      <DialogActions>
        {onClose && (
          <Button onClick={onClose} disabled={createTeam.isPending}>
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim() || createTeam.isPending}
        >
          {createTeam.isPending ? 'Creating...' : 'Create Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
