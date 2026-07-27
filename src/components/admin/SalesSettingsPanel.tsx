import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Paper,
  useTheme,
  Divider,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
  useSystemSettings,
  useAddIcp,
  useRenameIcp,
  useRemoveIcp,
  useAddProfile,
  useRenameProfile,
  useRemoveProfile,
} from '@/hooks/api/useSettings';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

interface EntryListProps {
  title: string;
  description: string;
  placeholder: string;
  emptyLabel: string;
  entries: { _id: string; name: string }[];
  isDarkMode: boolean;
  readOnly: boolean;
  newValue: string;
  onNewValueChange: (value: string) => void;
  onAdd: () => void;
  isAdding: boolean;
  editingId: string | null;
  editingValue: string;
  onEditingValueChange: (value: string) => void;
  onStartEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  isSaving: boolean;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}

const EntryList = ({
  title,
  description,
  placeholder,
  emptyLabel,
  entries,
  isDarkMode,
  readOnly,
  newValue,
  onNewValueChange,
  onAdd,
  isAdding,
  editingId,
  editingValue,
  onEditingValueChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  isSaving,
  onRemove,
  isRemoving,
}: EntryListProps) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
      {title}
    </Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, fontSize: '0.8rem' }}>
      {description}
    </Typography>

    {!readOnly && (
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          placeholder={placeholder}
          fullWidth
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',
              bgcolor: isDarkMode ? `color-mix(in srgb, #fff 2%, transparent)` : `color-mix(in srgb, #000 2%, transparent)`,
            },
          }}
        />
        <Button
          variant="contained"
          onClick={onAdd}
          disabled={!newValue.trim() || isAdding}
          startIcon={isAdding ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          sx={{
            bgcolor: tokens.brand.primary,
            color: '#fff',
            fontWeight: 700,
            borderRadius: '14px',
            textTransform: 'none',
            px: 3,
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            '&:hover': { bgcolor: tokens.brand.primaryDark, boxShadow: 'none' },
          }}
        >
          Add
        </Button>
      </Stack>
    )}

    {entries.length > 0 ? (
      <Stack spacing={1}>
        {entries.map((entry) => (
          <Box
            key={entry._id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              p: 1.25,
              borderRadius: '14px',
              bgcolor: isDarkMode ? `color-mix(in srgb, #fff 2%, transparent)` : `color-mix(in srgb, #000 2%, transparent)`,
            }}
          >
            {editingId === entry._id ? (
              <>
                <TextField
                  size="small"
                  fullWidth
                  value={editingValue}
                  onChange={(e) => onEditingValueChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onSaveEdit();
                    }
                  }}
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      bgcolor: isDarkMode ? `color-mix(in srgb, #000 20%, transparent)` : '#fff',
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={onSaveEdit}
                  disabled={!editingValue.trim() || isSaving}
                  sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}
                >
                  <CheckIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onCancelEdit}
                  sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' } }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </>
            ) : (
              <>
                <Chip
                  label={entry.name}
                  size="small"
                  sx={{
                    bgcolor: `color-mix(in srgb, ${tokens.brand.primary} 8%, transparent)`,
                    color: tokens.brand.primary,
                    fontWeight: 700,
                  }}
                />
                {!readOnly && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => onStartEdit(entry._id, entry.name)}
                      sx={{ color: 'text.secondary', '&:hover': { color: tokens.brand.primary } }}
                    >
                      <EditIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onRemove(entry._id)}
                      disabled={isRemoving}
                      sx={{ color: 'text.secondary', '&:hover': { color: '#EF4444' } }}
                    >
                      <DeleteIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Box>
                )}
              </>
            )}
          </Box>
        ))}
      </Stack>
    ) : (
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {emptyLabel}
      </Typography>
    )}
  </Box>
);

export const SalesSettingsPanel = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { data: settings, isLoading } = useSystemSettings();
  const addIcp = useAddIcp();
  const renameIcp = useRenameIcp();
  const removeIcp = useRemoveIcp();
  const addProfile = useAddProfile();
  const renameProfile = useRenameProfile();
  const removeProfile = useRemoveProfile();
  const addToast = useUIStore((s) => s.addToast);

  const [newIcpName, setNewIcpName] = useState('');
  const [editingIcpId, setEditingIcpId] = useState<string | null>(null);
  const [editingIcpName, setEditingIcpName] = useState('');

  const [newProfileName, setNewProfileName] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingProfileName, setEditingProfileName] = useState('');

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const getErrorMessage = (err: any, fallback: string) => err?.response?.data?.error?.message || fallback;

  const handleAddIcp = () => {
    const name = newIcpName.trim();
    if (!name) return;
    addIcp.mutate(name, {
      onSuccess: () => {
        setNewIcpName('');
        addToast({ message: 'ICP added successfully!', severity: 'success' });
      },
      onError: (err: any) => addToast({ message: getErrorMessage(err, 'Failed to add ICP.'), severity: 'error' }),
    });
  };

  const handleSaveEditIcp = () => {
    const name = editingIcpName.trim();
    if (!editingIcpId || !name) return;
    renameIcp.mutate(
      { icpId: editingIcpId, name },
      {
        onSuccess: () => {
          addToast({ message: 'ICP renamed successfully!', severity: 'success' });
          setEditingIcpId(null);
          setEditingIcpName('');
        },
        onError: (err: any) => addToast({ message: getErrorMessage(err, 'Failed to rename ICP.'), severity: 'error' }),
      },
    );
  };

  const handleRemoveIcp = (icpId: string) => {
    removeIcp.mutate(icpId, {
      onSuccess: () => addToast({ message: 'ICP removed successfully!', severity: 'success' }),
      onError: (err: any) => addToast({ message: getErrorMessage(err, 'Failed to remove ICP.'), severity: 'error' }),
    });
  };

  const handleAddProfile = () => {
    const name = newProfileName.trim();
    if (!name) return;
    addProfile.mutate(name, {
      onSuccess: () => {
        setNewProfileName('');
        addToast({ message: 'Profile added successfully!', severity: 'success' });
      },
      onError: (err: any) => addToast({ message: getErrorMessage(err, 'Failed to add profile.'), severity: 'error' }),
    });
  };

  const handleSaveEditProfile = () => {
    const name = editingProfileName.trim();
    if (!editingProfileId || !name) return;
    renameProfile.mutate(
      { profileId: editingProfileId, name },
      {
        onSuccess: () => {
          addToast({ message: 'Profile renamed successfully!', severity: 'success' });
          setEditingProfileId(null);
          setEditingProfileName('');
        },
        onError: (err: any) => addToast({ message: getErrorMessage(err, 'Failed to rename profile.'), severity: 'error' }),
      },
    );
  };

  const handleRemoveProfile = (profileId: string) => {
    removeProfile.mutate(profileId, {
      onSuccess: () => addToast({ message: 'Profile removed successfully!', severity: 'success' }),
      onError: (err: any) => addToast({ message: getErrorMessage(err, 'Failed to remove profile.'), severity: 'error' }),
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: '28px',
        border: `1px solid ${isDarkMode ? `color-mix(in srgb, #fff 5%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 5%, transparent)`}`,
        bgcolor: isDarkMode ? `color-mix(in srgb, #121212 60%, transparent)` : '#ffffff',
        boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 12px 40px rgba(93, 26, 137, 0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${`color-mix(in srgb, ${tokens.brand.primary} 12%, transparent)`} 0%, transparent 70%)`,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: '16px',
              bgcolor: isDarkMode ? `color-mix(in srgb, ${tokens.brand.primary} 15%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 8%, transparent)`,
              color: tokens.brand.primary,
              boxShadow: `inset 0 2px 10px ${`color-mix(in srgb, ${tokens.brand.primary} 10%, transparent)`}`,
            }}
          >
            <StorefrontOutlinedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: isDarkMode ? '#fff' : tokens.text.primary, mb: 0.25 }}
            >
              Sales Configuration
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>
              Manage ICPs and Profiles used across leads and the sales pipeline.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: isDarkMode ? `color-mix(in srgb, #fff 5%, transparent)` : `color-mix(in srgb, #000 5%, transparent)` }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <EntryList
              title="Ideal Customer Profiles (ICPs)"
              description="Manage the list of ICPs available when creating and filtering leads."
              placeholder="New ICP name"
              emptyLabel="No ICPs added yet."
              entries={settings?.icps ?? []}
              isDarkMode={isDarkMode}
              readOnly={readOnly}
              newValue={newIcpName}
              onNewValueChange={setNewIcpName}
              onAdd={handleAddIcp}
              isAdding={addIcp.isPending}
              editingId={editingIcpId}
              editingValue={editingIcpName}
              onEditingValueChange={setEditingIcpName}
              onStartEdit={(id, name) => {
                setEditingIcpId(id);
                setEditingIcpName(name);
              }}
              onCancelEdit={() => {
                setEditingIcpId(null);
                setEditingIcpName('');
              }}
              onSaveEdit={handleSaveEditIcp}
              isSaving={renameIcp.isPending}
              onRemove={handleRemoveIcp}
              isRemoving={removeIcp.isPending}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <EntryList
              title="Profiles"
              description="Manage the list of Profiles available when creating and filtering leads."
              placeholder="New profile name"
              emptyLabel="No profiles added yet."
              entries={settings?.profiles ?? []}
              isDarkMode={isDarkMode}
              readOnly={readOnly}
              newValue={newProfileName}
              onNewValueChange={setNewProfileName}
              onAdd={handleAddProfile}
              isAdding={addProfile.isPending}
              editingId={editingProfileId}
              editingValue={editingProfileName}
              onEditingValueChange={setEditingProfileName}
              onStartEdit={(id, name) => {
                setEditingProfileId(id);
                setEditingProfileName(name);
              }}
              onCancelEdit={() => {
                setEditingProfileId(null);
                setEditingProfileName('');
              }}
              onSaveEdit={handleSaveEditProfile}
              isSaving={renameProfile.isPending}
              onRemove={handleRemoveProfile}
              isRemoving={removeProfile.isPending}
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};
