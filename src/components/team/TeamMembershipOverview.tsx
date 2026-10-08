import { useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { type Team, useRemoveTeamMember, useUpdateTeam } from '@/hooks/api/useTeam';
import { AddExistingTeamMemberPanel } from './AddExistingTeamMemberPanel';
import { getDisplayName } from '@/utils/formatters';
import { showApiError } from '@/utils/apiError';

const TeamActions = ({ team }: { team: Team }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team.name);
  const [removing, setRemoving] = useState<string | null>(null);
  const update = useUpdateTeam(team._id);
  const remove = useRemoveTeamMember(team._id);
  return <>
    <Button onClick={() => { setName(team.name); setOpen(true); }}>Manage {team.name}</Button>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Manage {team.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, py: 2 }}>
          <TextField label="Team name" value={name} onChange={(e) => setName(e.target.value)} fullWidth inputProps={{ maxLength: 100 }} />
          <Button disabled={!name.trim() || update.isPending} onClick={() => update.mutate(name.trim(), { onError: showApiError })}>Save</Button>
        </Box>
        <Typography variant="subtitle2">Members</Typography>
        {team.members.map((member) => <Box key={member._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
          <Typography>{getDisplayName(member)}</Typography>
          <Button color="error" onClick={() => setRemoving(member._id)}>Remove from this team</Button>
        </Box>)}
        <Box sx={{ mt: 2 }}><AddExistingTeamMemberPanel teamId={team._id} /></Box>
      </DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)}>Close</Button></DialogActions>
    </Dialog>
    <Dialog open={Boolean(removing)} onClose={() => setRemoving(null)}>
      <DialogTitle>Remove member from {team.name}?</DialogTitle>
      <DialogContent>Their other team memberships will remain active.</DialogContent>
      <DialogActions>
        <Button onClick={() => setRemoving(null)}>Cancel</Button>
        <Button color="error" disabled={remove.isPending} onClick={() => removing && remove.mutate(removing, { onSuccess: () => setRemoving(null), onError: showApiError })}>Remove</Button>
      </DialogActions>
    </Dialog>
  </>;
};

export const TeamMembershipOverview = ({ teams }: { teams: Team[] }) => <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
  {teams.map((team) => <Box key={team._id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
    <Typography variant="h6">{team.name}</Typography>
    <Typography variant="body2" color="text.secondary">Manager: {team.managerId ? getDisplayName(team.managerId) : 'Unavailable'}</Typography>
    <TeamActions team={team} />
  </Box>)}
</Box>;

export const MemberTeamBadges = ({ teams, userId }: { teams: Team[]; userId: string }) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, my: 1 }}>
  {teams.filter((team) => team.managerId?._id === userId || team.members.some((member) => member._id === userId))
    .map((team) => <Chip key={team._id} label={team.name} size="small" variant="outlined" />)}
</Box>;
