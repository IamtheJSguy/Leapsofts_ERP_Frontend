import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
  InputAdornment,
  Alert,
  Divider,
  useTheme,
} from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import LinkIcon from '@mui/icons-material/Link';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { useUpdateUser } from '@/hooks/api/useUsers';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/api/useSettings';
import { useSyncGoogleSheet } from '@/hooks/api/useGoogleSheets';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import { getDisplayName } from '@/utils/formatters';

export default function ProfilePage() {
  const { user } = useAuth();
  const updateAuthUser = useAuthStore((s) => s.updateUser);
  const { data: settings } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const syncGoogleSheet = useSyncGoogleSheet();
  const updateUserMutation = useUpdateUser();
  const addToast = useUIStore((s) => s.addToast);
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'google-sheet'>('profile');

  // Profile Form State (department & jobTitle removed)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Google Sheet Link State
  const [sheetUrl, setSheetUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStageText, setSyncStageText] = useState('');
  const [linkError, setLinkError] = useState('');

  // Hydrate fields from user and settings
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      setSheetUrl(settings.referenceSheetUrl || '');
    }
  }, [settings]);

  const displayName = getDisplayName(user);
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Helper to extract Spreadsheet ID
  const extractSheetId = (input: string): string => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = input.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    return input.trim();
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    updateUserMutation.mutate(
      {
        id: user._id,
        data: {
          firstName,
          lastName,
          phone,
        },
      },
      {
        onSuccess: () => {
          updateAuthUser({
            firstName,
            lastName,
            phone,
          });
          addToast({ message: 'Profile updated successfully!', severity: 'success' });
        },
        onError: (err: any) => {
          addToast({
            message: err?.response?.data?.message || 'Failed to update profile details.',
            severity: 'error',
          });
        },
      }
    );
  };

  const handleSyncGoogleSheet = () => {
    const trimmedInput = sheetUrl.trim();
    if (!trimmedInput) {
      setLinkError('Google Sheet URL or Spreadsheet ID is required.');
      return;
    }

    const isLink = trimmedInput.includes('docs.google.com/spreadsheets');
    if (trimmedInput.startsWith('http') && !isLink) {
      setLinkError('Please enter a valid Google Sheets URL (e.g. docs.google.com/spreadsheets/d/...)');
      return;
    }

    const sheetId = extractSheetId(trimmedInput);
    if (!sheetId) {
      setLinkError('Unable to extract a valid Spreadsheet ID.');
      return;
    }

    setLinkError('');
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncStageText('Connecting to Google Sheets API...');

    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev < 90) return prev + 15;
        return prev;
      });
    }, 250);

    // Save Sheet URL to settings and trigger sync API
    updateSettings.mutate(
      {
        ...settings,
        referenceSheetUrl: trimmedInput,
      },
      {
        onSuccess: () => {
          syncGoogleSheet.mutate(sheetId, {
            onSuccess: () => {
              clearInterval(progressInterval);
              setSyncProgress(100);
              setSyncStageText('Import complete!');
              setTimeout(() => {
                setIsSyncing(false);
                addToast({ message: 'Google Sheet linked & synchronized successfully!', severity: 'success' });
              }, 600);
            },
            onError: (err: any) => {
              clearInterval(progressInterval);
              setIsSyncing(false);
              addToast({
                message: err?.response?.data?.message || 'Failed to sync spreadsheet. Please verify permissions.',
                severity: 'error',
              });
            },
          });
        },
        onError: () => {
          clearInterval(progressInterval);
          setIsSyncing(false);
          addToast({ message: 'Failed to update settings with reference sheet.', severity: 'error' });
        },
      }
    );
  };

  const handleDisconnectGoogleSheet = () => {
    updateSettings.mutate(
      {
        ...settings,
        referenceSheetUrl: '',
      },
      {
        onSuccess: () => {
          setSheetUrl('');
          addToast({ message: 'Google Sheet unlinked successfully.', severity: 'info' });
        },
        onError: () => {
          addToast({ message: 'Failed to unlink Google Sheet.', severity: 'error' });
        },
      }
    );
  };

  const textFieldSx = {
    mb: 3,
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
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, width: '100%', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Page Header */}
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 850,
            letterSpacing: '-0.03em',
            mb: 0.75,
            color: isDarkMode ? '#fff' : tokens.text.primary,
          }}
        >
          Profile Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.88rem' }}>
          Manage your personal details, representative identity, and Google Sheet sync pipelines.
        </Typography>
      </Box>

      {/* Modern Sub-Tab Pill Switcher */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 0.5,
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: '16px',
          width: 'fit-content',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
        }}
      >
        <Button
          onClick={() => setActiveTab('profile')}
          sx={{
            px: 3.5,
            py: 1,
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            color: activeTab === 'profile'
              ? (isDarkMode ? '#fff' : tokens.brand.primary)
              : 'text.secondary',
            bgcolor: activeTab === 'profile'
              ? (isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff')
              : 'transparent',
            boxShadow: activeTab === 'profile' && !isDarkMode
              ? '0 1px 3px rgba(0,0,0,0.05)'
              : 'none',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: activeTab === 'profile'
                ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#fff')
                : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
            }
          }}
        >
          User Profile
        </Button>
        <Button
          onClick={() => setActiveTab('google-sheet')}
          sx={{
            px: 3.5,
            py: 1,
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            color: activeTab === 'google-sheet'
              ? (isDarkMode ? '#fff' : tokens.brand.primary)
              : 'text.secondary',
            bgcolor: activeTab === 'google-sheet'
              ? (isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff')
              : 'transparent',
            boxShadow: activeTab === 'google-sheet' && !isDarkMode
              ? '0 1px 3px rgba(0,0,0,0.05)'
              : 'none',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: activeTab === 'google-sheet'
                ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#fff')
                : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
            }
          }}
        >
          Google Sheet Sync
        </Button>
      </Box>

      {/* Tab Content Panels (stretched to full page width) */}
      <Box sx={{ width: '100%' }}>
        {activeTab === 'profile' ? (
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              borderRadius: '24px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : tokens.surface.border}`,
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
              overflow: 'hidden',
              boxShadow: tokens.shadow.card,
            }}
          >
            {/* Header Area (minimalist, flat, cover gradient removed) */}
            <Box
              sx={{
                p: 4.5,
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.005)',
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : tokens.surface.border}`,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: '50%',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93, 26, 137, 0.08)'}`,
                  bgcolor: isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
                  display: 'inline-flex',
                }}
              >
                <Avatar
                  sx={{
                    width: 84,
                    height: 84,
                    bgcolor: tokens.brand.primary,
                    fontWeight: 800,
                    fontSize: '1.85rem',
                    boxShadow: '0 4px 16px rgba(93, 26, 137, 0.12)',
                  }}
                >
                  {initials}
                </Avatar>
              </Box>

              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h5" sx={{ fontWeight: 850, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em', mb: 0.75 }}>
                  {displayName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {user?.role === 'admin' ? 'Administrator' : 'Sales Representative'}
                  </Typography>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.semantic.success }} />
                  <Typography variant="caption" sx={{ color: tokens.semantic.success, fontWeight: 700 }}>
                    Active Session
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Profile Form (Full Page Layout) */}
            <Box component="form" onSubmit={handleProfileSave} sx={{ p: 5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 3.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Personal Information
              </Typography>
              
              <Grid container spacing={3.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    fullWidth
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone Number"
                    fullWidth
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocalPhoneOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email Address"
                    fullWidth
                    value={user?.email || ''}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Your email is connected to your primary auth login account and cannot be modified."
                    FormHelperTextProps={{
                      sx: { color: 'text.secondary', fontSize: '0.74rem', mt: 0.75 }
                    }}
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>

              {/* Action Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateUserMutation.isPending}
                  startIcon={updateUserMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    bgcolor: tokens.brand.primary,
                    color: '#fff',
                    fontWeight: 700,
                    px: 5,
                    py: 1.4,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '0.86rem',
                    boxShadow: 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      bgcolor: tokens.brand.primaryLight,
                      boxShadow: '0 4px 12px rgba(93, 26, 137, 0.2)',
                    },
                    '&:active': {
                      transform: 'translateY(1px)',
                    },
                  }}
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {/* Connection Form Column */}
            <Grid item xs={12} lg={7}>
              <Paper
                elevation={0}
                sx={{
                  p: 4.5,
                  borderRadius: '24px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : tokens.surface.border}`,
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  boxShadow: tokens.shadow.card,
                  height: '100%',
                }}
              >
                {/* Header Title Area */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5 }}>
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: '12px',
                      bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.06)',
                      color: tokens.brand.primary,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <CloudQueueIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em', mb: 0.25 }}>
                      Google Sheets Integration
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Synchronize external lead spreadsheet directories automatically.
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 4, opacity: isDarkMode ? 0.08 : 0.08 }} />

                {linkError && (
                  <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3.5, borderRadius: '12px' }}>
                    {linkError}
                  </Alert>
                )}

                {/* URL Input field */}
                <TextField
                  label="Google Sheet Link URL"
                  fullWidth
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx}
                />

                {/* Button Actions Layout */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1.5 }}>
                  {settings?.referenceSheetUrl && (
                    <Button
                      variant="outlined"
                      onClick={handleDisconnectGoogleSheet}
                      sx={{
                        color: tokens.semantic.error,
                        borderColor: 'rgba(196, 69, 69, 0.25)',
                        fontWeight: 700,
                        px: 3.5,
                        py: 1.25,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontSize: '0.84rem',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: tokens.semantic.error,
                          bgcolor: 'rgba(196, 69, 69, 0.04)',
                        },
                      }}
                    >
                      Disconnect
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    onClick={handleSyncGoogleSheet}
                    disabled={isSyncing}
                    startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                      bgcolor: tokens.brand.primary,
                      color: '#fff',
                      fontWeight: 700,
                      px: 4,
                      py: 1.25,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontSize: '0.86rem',
                      boxShadow: 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        bgcolor: tokens.brand.primaryLight,
                        boxShadow: '0 4px 12px rgba(93, 26, 137, 0.2)',
                      },
                      '&:active': {
                        transform: 'translateY(1px)',
                      },
                    }}
                  >
                    {isSyncing ? 'Syncing...' : 'Connect & Sync'}
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Sync Logs / Info Column */}
            <Grid item xs={12} lg={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 4.5,
                  borderRadius: '24px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : tokens.surface.border}`,
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  boxShadow: tokens.shadow.card,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3.5,
                  height: '100%',
                }}
              >
                {/* Connection Status Indicator */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sync Status Details
                  </Typography>

                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      bgcolor: settings?.referenceSheetUrl
                        ? (isDarkMode ? 'rgba(45, 138, 94, 0.08)' : 'rgba(45, 138, 94, 0.04)')
                        : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
                      border: `1px solid ${
                        settings?.referenceSheetUrl
                          ? (isDarkMode ? 'rgba(45, 138, 94, 0.18)' : 'rgba(45, 138, 94, 0.1)')
                          : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    {settings?.referenceSheetUrl ? (
                      <CheckCircleOutlineIcon sx={{ color: tokens.semantic.success, fontSize: 28 }} />
                    ) : (
                      <CloudQueueIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 0.5 }}>
                        {settings?.referenceSheetUrl ? 'Spreadsheet Sync Active' : 'Offline Mode'}
                      </Typography>
                      {settings?.referenceSheetUrl ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{ display: 'block', maxWidth: 180 }}
                          >
                            {settings.referenceSheetUrl}
                          </Typography>
                          <IconButton
                            component="a"
                            href={settings.referenceSheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            sx={{ color: tokens.brand.primary, p: 0.25 }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Paste a spreadsheet URL to connect.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Step-by-Step guide details */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Connection Guide
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                      { step: 1, text: 'Open your Google Spreadsheet.' },
                      { step: 2, text: 'Click Share in top-right corner.' },
                      { step: 3, text: 'Change General Access to "Anyone with the link can view".' },
                      { step: 4, text: 'Copy the link URL and paste it in the sync URL field.' },
                    ].map((item) => (
                      <Box key={item.step} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(93, 26, 137, 0.05)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 0,
                            mt: 0.25,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 800, color: tokens.brand.primary }}>
                            {item.step}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                          {item.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Informational Alerts */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.08)' : 'rgba(93, 26, 137, 0.03)',
                    border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.08)'}`,
                    display: 'flex',
                    gap: 1.5,
                    mt: 'auto',
                  }}
                >
                  <InfoOutlinedIcon sx={{ color: tokens.brand.primary, fontSize: 18, mt: 0.25 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.76rem', color: 'text.secondary', lineHeight: 1.45 }}>
                    The sales database processes lead directory synchronizations twice daily automatically. Triggering "Connect & Sync" initiates an immediate manual reload override.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Syncing Overlay Dialog */}
      {isSyncing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <Paper
            sx={{
              p: 4,
              borderRadius: '24px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              textAlign: 'center',
              maxWidth: 360,
              width: '90%',
            }}
          >
            <CircularProgress
              variant="determinate"
              value={syncProgress}
              size={64}
              thickness={4.5}
              sx={{ color: tokens.brand.primary, mb: 3 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: isDarkMode ? '#fff' : tokens.text.primary }}>
              Synchronizing Directory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {syncStageText} ({syncProgress}%)
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
