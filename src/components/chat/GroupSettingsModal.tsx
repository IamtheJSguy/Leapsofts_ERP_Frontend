import { useState, useMemo } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Button,
  useTheme,
  Divider,
  TextField,
  InputAdornment,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { tokens } from '@/styles/tokens';
import { useAuth } from '@/hooks/useAuth';
import { getDisplayName } from '@/utils/formatters';
import type { Conversation, User } from '@/types';
import { useAddGroupMember, useRemoveGroupMember } from '@/hooks/api/useChat';
import { useUIStore } from '@/store/useUIStore';
import { useUsers } from '@/hooks/api/useUsers';

interface GroupSettingsModalProps {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export const GroupSettingsModal = ({ open, onClose, conversation }: GroupSettingsModalProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { user: currentUser } = useAuth();
  const { data: dbUsers = [] } = useUsers();
  const addToast = useUIStore((s) => s.addToast);

  const { mutate: addMember, isPending: isAdding } = useAddGroupMember();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveGroupMember();

  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'add' | 'remove' | null;
    participantId: string | null;
    participantName: string;
  }>({ isOpen: false, action: null, participantId: null, participantName: '' });

  // Check if current user is the admin of the group
  const isAdmin = conversation.admin === currentUser?._id;

  const initial = conversation.name
    ? conversation.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'G';

  // Filter users that are NOT currently in the group
  const availableUsers = useMemo(() => {
    const participantIds = conversation.participants.map((p) => typeof p === 'string' ? p : p._id);
    let filtered = dbUsers.filter((u) => !participantIds.includes(u._id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) => getDisplayName(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [dbUsers, conversation.participants, searchQuery]);

  const handleAddMemberClick = (participantId: string, name: string) => {
    setConfirmDialog({ isOpen: true, action: 'add', participantId, participantName: name });
  };

  const handleRemoveMemberClick = (participantId: string, name: string) => {
    if (participantId === currentUser?._id) {
      addToast({ message: 'You cannot remove yourself.', severity: 'error' });
      return;
    }
    setConfirmDialog({ isOpen: true, action: 'remove', participantId, participantName: name });
  };

  const confirmAction = () => {
    const { action, participantId } = confirmDialog;
    if (!participantId) return;

    if (action === 'add') {
      addMember(
        { conversationId: conversation._id, participantId },
        {
          onSuccess: () => {
            addToast({ message: 'Member added successfully', severity: 'success' });
            setShowAddMember(false);
            setSearchQuery('');
            setConfirmDialog({ isOpen: false, action: null, participantId: null, participantName: '' });
          },
          onError: (err: any) => {
            addToast({ message: err?.response?.data?.message || 'Failed to add member', severity: 'error' });
            setConfirmDialog({ isOpen: false, action: null, participantId: null, participantName: '' });
          },
        }
      );
    } else if (action === 'remove') {
      removeMember(
        { conversationId: conversation._id, participantId },
        {
          onSuccess: () => {
            addToast({ message: 'Member removed successfully', severity: 'success' });
            setConfirmDialog({ isOpen: false, action: null, participantId: null, participantName: '' });
          },
          onError: (err: any) => {
            addToast({ message: err?.response?.data?.message || 'Failed to remove member', severity: 'error' });
            setConfirmDialog({ isOpen: false, action: null, participantId: null, participantName: '' });
          },
        }
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDarkMode ? '#1e1b24' : '#fff',
          backgroundImage: 'none',
          boxShadow: tokens.shadow.card,
          width: '100%',
          maxWidth: 400,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header Area */}
      <Box sx={{ position: 'relative', p: 3, textAlign: 'center', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>

        <Avatar
          sx={{
            width: 72,
            height: 72,
            mx: 'auto',
            mb: 2,
            bgcolor: tokens.brand.primary,
            color: '#fff',
            fontSize: '1.8rem',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(93,26,137,0.2)',
          }}
        >
          {initial}
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
          {conversation.name || 'Group Chat'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {conversation.description || 'No description provided.'}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: tokens.brand.primary, fontWeight: 700 }}>
          {conversation.participants.length} Members
        </Typography>
      </Box>

      <Divider sx={{ opacity: 0.1 }} />

      {/* Participants List */}
      <Box sx={{ p: 2, maxHeight: 300, overflowY: 'auto' }}>
        <List disablePadding>
          {conversation.participants.map((p) => {
            const memberId = typeof p === 'string' ? p : p._id;
            const memberObj = typeof p === 'string' ? dbUsers.find((u) => u._id === p) : p;
            const isGroupAdmin = conversation.admin === memberId;
            const isMe = memberId === currentUser?._id;

            return (
              <ListItem
                key={memberId}
                disablePadding
                sx={{ mb: 1, px: 1, py: 0.5, borderRadius: '12px', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb' } }}
                secondaryAction={
                  isAdmin && !isMe ? (
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveMemberClick(memberId, getDisplayName(memberObj as User))}
                      disabled={isRemoving}
                      sx={{ color: tokens.semantic.error, opacity: 0.7, '&:hover': { opacity: 1, bgcolor: 'rgba(239,68,68,0.1)' } }}
                      size="small"
                      title="Remove member"
                    >
                      <PersonRemoveIcon fontSize="small" />
                    </IconButton>
                  ) : isGroupAdmin ? (
                    <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, px: 1, py: 0.5, bgcolor: tokens.brand.primary + '15', borderRadius: '8px' }}>
                      Admin
                    </Typography>
                  ) : null
                }
              >
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: 'text.primary', fontWeight: 600, fontSize: '0.85rem' }}>
                    {getDisplayName(memberObj as User).charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {getDisplayName(memberObj as User)} {isMe ? '(You)' : ''}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {memberObj?.email || ''}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Admin Add Member Area */}
      {isAdmin && (
        <Box sx={{ p: 2, pt: 0, mt: 1 }}>
          {!showAddMember ? (
            <Button
              fullWidth
              startIcon={<PersonAddIcon />}
              onClick={() => setShowAddMember(true)}
              sx={{
                py: 1.5,
                borderRadius: '16px',
                color: tokens.brand.primary,
                bgcolor: isDarkMode ? 'rgba(93,26,137,0.1)' : 'rgba(93,26,137,0.05)',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: isDarkMode ? 'rgba(93,26,137,0.2)' : 'rgba(93,26,137,0.1)' }
              }}
            >
              Add New Member
            </Button>
          ) : (
            <Box sx={{ bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f9fafb', borderRadius: '16px', p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, flex: 1 }}>Search Team Members</Typography>
                <IconButton size="small" onClick={() => { setShowAddMember(false); setSearchQuery(''); }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff' } }}
              />
              <List sx={{ maxHeight: 150, overflowY: 'auto', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff', borderRadius: '12px' }}>
                {availableUsers.map(u => (
                  <ListItem
                    key={u._id}
                    disablePadding
                    sx={{ borderRadius: '8px', mb: 0.5 }}
                  >
                    <ListItemButton
                      onClick={() => handleAddMemberClick(u._id, getDisplayName(u))}
                      disabled={isAdding}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>{getDisplayName(u).charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{getDisplayName(u)}</Typography>}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {availableUsers.length === 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', py: 2 }}>
                    No more members to add.
                  </Typography>
                )}
              </List>
            </Box>
          )}
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: isDarkMode ? '#1e1b24' : '#fff',
            backgroundImage: 'none',
            boxShadow: tokens.shadow.card,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Confirm {confirmDialog.action === 'add' ? 'Addition' : 'Removal'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary' }}>
            Are you sure you want to {confirmDialog.action === 'add' ? 'add' : 'remove'} <strong>{confirmDialog.participantName}</strong> {confirmDialog.action === 'add' ? 'to' : 'from'} this group?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={confirmAction}
            variant="contained"
            disabled={isAdding || isRemoving}
            sx={{
              bgcolor: confirmDialog.action === 'add' ? tokens.brand.primary : tokens.semantic.error,
              fontWeight: 700,
              borderRadius: '8px',
              '&:hover': {
                bgcolor: confirmDialog.action === 'add' ? tokens.brand.primary : tokens.semantic.error,
                opacity: 0.9
              }
            }}
          >
            {isAdding || isRemoving ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
