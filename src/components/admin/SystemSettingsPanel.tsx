import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Paper,
  useTheme,
  alpha,
  Divider,
  Switch,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
  useSystemSettings,
  useUpdateSystemSettings,
  useAddIcp,
  useRenameIcp,
  useRemoveIcp,
} from '@/hooks/api/useSettings';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

export const SystemSettingsPanel = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const addIcp = useAddIcp();
  const renameIcp = useRenameIcp();
  const removeIcp = useRemoveIcp();
  const addToast = useUIStore((s) => s.addToast);
  const [retentionMonths, setRetentionMonths] = useState('12');
  const [dailyReportEnabled, setDailyReportEnabled] = useState(false);
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [newIcpName, setNewIcpName] = useState('');
  const [editingIcpId, setEditingIcpId] = useState<string | null>(null);
  const [editingIcpName, setEditingIcpName] = useState('');

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const getErrorMessage = (err: any, fallback: string) =>
    err?.response?.data?.error?.message || fallback;

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

  const handleStartEditIcp = (icpId: string, name: string) => {
    setEditingIcpId(icpId);
    setEditingIcpName(name);
  };

  const handleCancelEditIcp = () => {
    setEditingIcpId(null);
    setEditingIcpName('');
  };

  const handleSaveEditIcp = () => {
    const name = editingIcpName.trim();
    if (!editingIcpId || !name) return;
    renameIcp.mutate({ icpId: editingIcpId, name }, {
      onSuccess: () => {
        addToast({ message: 'ICP renamed successfully!', severity: 'success' });
        handleCancelEditIcp();
      },
      onError: (err: any) => addToast({ message: getErrorMessage(err, 'Failed to rename ICP.'), severity: 'error' }),
    });
  };

  const handleRemoveIcp = (icpId: string) => {
    removeIcp.mutate(icpId, {
      onSuccess: () => addToast({ message: 'ICP removed successfully!', severity: 'success' }),
      onError: (err: any) => addToast({ message: getErrorMessage(err, 'Failed to remove ICP.'), severity: 'error' }),
    });
  };

  useEffect(() => {
    if (settings) {
      setRetentionMonths(String(settings.chatRetentionMonths ?? 12));
      setDailyReportEnabled(settings.automatedUserReportSchedule?.daily ?? false);
      setWeeklyReportEnabled(settings.automatedUserReportSchedule?.weekly ?? true);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  const handleSave = () => {
    updateSettings.mutate(
      {
        chatRetentionMonths: Number(retentionMonths) || 12,
        automatedUserReportSchedule: {
          daily: dailyReportEnabled,
          weekly: weeklyReportEnabled,
        },
      },
      {
        onSuccess: () => addToast({ message: 'Settings saved successfully!', severity: 'success' }),
        onError: () => addToast({ message: 'Failed to save settings.', severity: 'error' }),
      },
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: '28px',
        border: `1px solid ${isDarkMode ? `color-mix(in srgb, #fff 5%, transparent)` : `color-mix(in srgb, ${tokens.brand.primary} 5%, transparent)`}`,
        bgcolor: isDarkMode ? `color-mix(in srgb, #121212 60%, transparent)` : '#ffffff',
        /* backdropFilter: 'blur(20px)' (removed for performance) */
        boxShadow: isDarkMode 
          ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
          : '0 12px 40px rgba(93, 26, 137, 0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient decorative blob */}
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
            <SettingsOutlinedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: isDarkMode ? '#fff' : tokens.text.primary,
                mb: 0.25,
              }}
            >
              System Configuration
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              Manage security policies and data retention settings.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: isDarkMode ? `color-mix(in srgb, #fff 5%, transparent)` : `color-mix(in srgb, #000 5%, transparent)` }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                Chat Retention Duration
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, fontSize: '0.8rem' }}>
                Set the number of months to keep chat history across the application before it is automatically deleted.
              </Typography>
              
              <TextField
                label="Months"
                type="number"
                fullWidth
                value={retentionMonths}
                onChange={(e) => setRetentionMonths(e.target.value)}
                disabled={readOnly}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    bgcolor: isDarkMode ? `color-mix(in srgb, #fff 2%, transparent)` : `color-mix(in srgb, #000 2%, transparent)`,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: `color-mix(in srgb, ${tokens.brand.primary} 30%, transparent)`,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: tokens.brand.primary,
                      borderWidth: '2px',
                    },
                    '&.Mui-focused': {
                      bgcolor: isDarkMode ? `color-mix(in srgb, ${tokens.brand.primary} 5%, transparent)` : '#fff',
                      boxShadow: `0 4px 20px ${`color-mix(in srgb, ${tokens.brand.primary} 10%, transparent)`}`,
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    '&.Mui-focused': {
                      color: tokens.brand.primary,
                    }
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: isDarkMode ? `color-mix(in srgb, #fff 5%, transparent)` : `color-mix(in srgb, #000 5%, transparent)` }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                Automated User Reports
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, fontSize: '0.8rem' }}>
                Schedule team user-detail reports delivered at 8:00 AM via in-app notification and email (when enabled in profile settings).
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: '16px', bgcolor: isDarkMode ? `color-mix(in srgb, #fff 2%, transparent)` : `color-mix(in srgb, #000 2%, transparent)` }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Send daily user detail report</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Previous calendar day, every morning at 8 AM.</Typography>
                  </Box>
                  <Switch
                    color="primary"
                    checked={dailyReportEnabled}
                    onChange={(e) => setDailyReportEnabled(e.target.checked)}
                    disabled={readOnly}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: '16px', bgcolor: isDarkMode ? `color-mix(in srgb, #fff 2%, transparent)` : `color-mix(in srgb, #000 2%, transparent)` }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Send weekly user detail report</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Previous 7 days ending yesterday, every Monday at 8 AM.</Typography>
                  </Box>
                  <Switch
                    color="primary"
                    checked={weeklyReportEnabled}
                    onChange={(e) => setWeeklyReportEnabled(e.target.checked)}
                    disabled={readOnly}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: isDarkMode ? `color-mix(in srgb, #fff 5%, transparent)` : `color-mix(in srgb, #000 5%, transparent)` }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            Ideal Customer Profiles (ICPs)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, fontSize: '0.8rem' }}>
            Manage the list of ICPs available when creating and filtering leads. Admins and managers can add, rename, or remove ICPs.
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
            <TextField
              size="small"
              placeholder="New ICP name"
              fullWidth
              value={newIcpName}
              onChange={(e) => setNewIcpName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddIcp();
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
              onClick={handleAddIcp}
              disabled={!newIcpName.trim() || addIcp.isPending}
              startIcon={addIcp.isPending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
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

          {settings?.icps && settings.icps.length > 0 ? (
            <Stack spacing={1}>
              {settings.icps.map((icp) => (
                <Box
                  key={icp._id}
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
                  {editingIcpId === icp._id ? (
                    <>
                      <TextField
                        size="small"
                        fullWidth
                        value={editingIcpName}
                        onChange={(e) => setEditingIcpName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEditIcp();
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
                        onClick={handleSaveEditIcp}
                        disabled={!editingIcpName.trim() || renameIcp.isPending}
                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}
                      >
                        <CheckIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleCancelEditIcp}
                        sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' } }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <Chip
                        label={icp.name}
                        size="small"
                        sx={{
                          bgcolor: `color-mix(in srgb, ${tokens.brand.primary} 8%, transparent)`,
                          color: tokens.brand.primary,
                          fontWeight: 700,
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleStartEditIcp(icp._id, icp.name)}
                          sx={{ color: 'text.secondary', '&:hover': { color: tokens.brand.primary } }}
                        >
                          <EditIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveIcp(icp._id)}
                          disabled={removeIcp.isPending}
                          sx={{ color: 'text.secondary', '&:hover': { color: '#EF4444' } }}
                        >
                          <DeleteIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Box>
                    </>
                  )}
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              No ICPs added yet.
            </Typography>
          )}
        </Box>

        {!readOnly && (
        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updateSettings.isPending}
            startIcon={updateSettings.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.92rem',
              px: 4.5,
              py: 1.5,
              borderRadius: '16px',
              textTransform: 'none',
              boxShadow: `0 8px 24px ${`color-mix(in srgb, ${tokens.brand.primary} 25%, transparent)`}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                transform: 'translateY(-2px)',
                boxShadow: `0 12px 30px ${`color-mix(in srgb, ${tokens.brand.primary} 35%, transparent)`}`,
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&.Mui-disabled': {
                bgcolor: `color-mix(in srgb, ${tokens.brand.primary} 50%, transparent)`,
                color: `color-mix(in srgb, #fff 70%, transparent)`,
              }
            }}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
        )}
      </Box>
    </Paper>
  );
};
