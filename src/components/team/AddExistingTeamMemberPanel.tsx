import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAddTeamMember, useAvailableTeamMembers } from '@/hooks/api/useTeam';
import { useUIStore } from '@/store/useUIStore';
import { getDisplayName } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';

interface AddExistingTeamMemberPanelProps {
  onAdded?: () => void;
}

export const AddExistingTeamMemberPanel = ({ onAdded }: AddExistingTeamMemberPanelProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: availableMembers = [], isLoading } = useAvailableTeamMembers();
  const addTeamMember = useAddTeamMember();

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return availableMembers;
    return availableMembers.filter((member) => {
      const name = getDisplayName(member).toLowerCase();
      const email = member.email.toLowerCase();
      const job = (member.jobTitle || '').toLowerCase();
      return name.includes(query) || email.includes(query) || job.includes(query);
    });
  }, [availableMembers, searchQuery]);

  const handleAdd = (userId: string, name: string) => {
    addTeamMember.mutate(userId, {
      onSuccess: () => {
        addToast({ message: `${name} added to your team.`, severity: 'success' });
        onAdded?.();
      },
      onError: (err: any) => {
        addToast({
          message: err?.response?.data?.message || 'Failed to add member to team.',
          severity: 'error',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 2, color: tokens.text.secondary, fontWeight: 500 }}>
        Select an existing employee who is not assigned to a team yet.
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Search by name, email, or job title..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
          },
        }}
      />

      {filteredMembers.length === 0 ? (
        <Box
          sx={{
            py: 5,
            px: 2,
            textAlign: 'center',
            borderRadius: '16px',
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Typography variant="body2" sx={{ color: tokens.text.secondary, fontWeight: 600 }}>
            {availableMembers.length === 0
              ? 'No unassigned employees are available right now.'
              : 'No employees matched your search.'}
          </Typography>
        </Box>
      ) : (
        <List
          sx={{
            maxHeight: 320,
            overflowY: 'auto',
            borderRadius: '16px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          {filteredMembers.map((member) => {
            const name = getDisplayName(member);
            const initials = name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <ListItem
                key={member._id}
                secondaryAction={
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                    disabled={addTeamMember.isPending}
                    onClick={() => handleAdd(member._id, name)}
                    sx={{
                      borderRadius: '16px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      px: 1.5,
                    }}
                  >
                    Add
                  </Button>
                }
                sx={{
                  borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: tokens.brand.primary, width: 36, height: 36, fontSize: '0.85rem' }}>
                    {initials}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={name}
                  secondary={
                    <>
                      {member.email}
                      {member.jobTitle ? ` · ${member.jobTitle}` : ''}
                    </>
                  }
                  primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.78rem' }}
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};
