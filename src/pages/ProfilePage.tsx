import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  TextField,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
  InputAdornment,
  Alert,
  Divider,
  useTheme,
  Switch,
  Fade,
  alpha,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import LinkIcon from '@mui/icons-material/Link';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ClearIcon from '@mui/icons-material/Clear';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { useUpdateMe, useMe, useChangePassword } from '@/hooks/api/useUsers';
import { useSystemSettings } from '@/hooks/api/useSettings';
import { useSyncMySheet } from '@/hooks/api/useGoogleSheets';
import { useAiProviderKeys, useUpdateAiProviderKeys } from '@/hooks/api/useAssistant';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import { getDisplayName } from '@/utils/formatters';
import { changePasswordSchema } from '@/utils/validators';
import type { AiProvider, UpdateAiProviderKeysPayload } from '@/types';

const AI_PROVIDER_OPTIONS: { value: AiProvider; label: string }[] = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'kimi', label: 'Kimi (Moonshot)' },
  { value: 'grok', label: 'Grok (xAI)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
];

const AI_KEY_FIELDS: { key: AiProvider; label: string; placeholder: string }[] = [
  { key: 'gemini', label: 'Google Gemini API Key', placeholder: 'AIza...' },
  { key: 'openai', label: 'OpenAI API Key', placeholder: 'sk-...' },
  { key: 'anthropic', label: 'Anthropic API Key', placeholder: 'sk-ant-...' },
  { key: 'grok', label: 'Grok (xAI) API Key', placeholder: 'xai-...' },
  { key: 'kimi', label: 'Kimi (Moonshot) API Key', placeholder: 'sk-...' },
];

const EMPTY_AI_KEY_INPUTS: Record<AiProvider, string> = {
  gemini: '',
  openai: '',
  anthropic: '',
  grok: '',
  kimi: '',
};

const EMPTY_SHOW_AI_KEYS: Record<AiProvider, boolean> = {
  gemini: false,
  openai: false,
  anthropic: false,
  grok: false,
  kimi: false,
};

export default function ProfilePage() {
  useMe(); // Fetch and hydrate store with latest profile data on mount
  const { user } = useAuth();
  const updateAuthUser = useAuthStore((s) => s.updateUser);
  const { data: settings } = useSystemSettings();

  const syncMySheet = useSyncMySheet();
  const updateMeMutation = useUpdateMe();
  const changePasswordMutation = useChangePassword();
  const addToast = useUIStore((s) => s.addToast);
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'google-sheet' | 'ai-providers'>('profile');

  // Profile Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // AI Providers state
  const { data: aiKeysStatus, isLoading: aiKeysLoading } = useAiProviderKeys();
  const updateAiKeysMutation = useUpdateAiProviderKeys();
  const [preferredAiProvider, setPreferredAiProvider] = useState<AiProvider | ''>('');
  const [aiKeyInputs, setAiKeyInputs] = useState<Record<AiProvider, string>>(EMPTY_AI_KEY_INPUTS);
  const [showAiKeys, setShowAiKeys] = useState<Record<AiProvider, boolean>>(EMPTY_SHOW_AI_KEYS);
  const [keysToClear, setKeysToClear] = useState<Set<AiProvider>>(new Set());

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    portal: true,
    kpiAlerts: true,
    meetingReminders: true,
  });

  // Google Sheet Link State
  const [sheetUrl, setSheetUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStageText, setSyncStageText] = useState('');
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setSheetUrl((user as any).googleSheetId || '');
      if (user.notificationPreferences) {
        setNotificationPrefs({
          email: user.notificationPreferences.email ?? true,
          portal: user.notificationPreferences.portal ?? true,
          kpiAlerts: user.notificationPreferences.kpiAlerts ?? true,
          meetingReminders: user.notificationPreferences.meetingReminders ?? true,
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (settings && !sheetUrl && !(user as any)?.googleSheetId) {
      setSheetUrl(settings.referenceSheetUrl || '');
    }
  }, [settings, user, sheetUrl]);

  useEffect(() => {
    if (aiKeysStatus) {
      setPreferredAiProvider(aiKeysStatus.preferredAiProvider ?? '');
      setKeysToClear(new Set());
      setAiKeyInputs({ ...EMPTY_AI_KEY_INPUTS });
    }
  }, [aiKeysStatus]);

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

  const handleAiKeysSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdateAiProviderKeysPayload = {
      preferredAiProvider: preferredAiProvider || null,
    };

    (Object.keys(aiKeyInputs) as AiProvider[]).forEach((key) => {
      if (keysToClear.has(key)) {
        payload[key] = '';
      } else if (aiKeyInputs[key].trim()) {
        payload[key] = aiKeyInputs[key].trim();
      }
    });

    updateAiKeysMutation.mutate(payload, {
      onSuccess: () => {
        addToast({ message: 'AI provider settings saved.', severity: 'success' });
        setAiKeyInputs({ ...EMPTY_AI_KEY_INPUTS });
        setKeysToClear(new Set());
      },
      onError: (err: any) => {
        addToast({
          message: err?.response?.data?.message || 'Failed to save AI provider settings.',
          severity: 'error',
        });
      },
    });
  };

  const markKeyForClear = (key: AiProvider) => {
    setKeysToClear((prev) => new Set(prev).add(key));
    setAiKeyInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();

    updateMeMutation.mutate(
      {
        firstName,
        lastName,
        phone,
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

  const handlePreferencesSave = async () => {
    updateMeMutation.mutate(
      {
        notificationPreferences: notificationPrefs,
      } as any,
      {
        onSuccess: () => {
          updateAuthUser({ notificationPreferences: notificationPrefs } as any);
          addToast({ message: 'Preferences updated successfully!', severity: 'success' });
        },
        onError: () => {
          addToast({ message: 'Failed to update preferences.', severity: 'error' });
        },
      }
    );
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    const result = changePasswordSchema.safeParse({
      oldPassword,
      newPassword,
      confirmNewPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === 'string') {
          fieldErrors[field] = issue.message;
        }
      });
      setPasswordErrors(fieldErrors);
      return;
    }

    changePasswordMutation.mutate(
      {
        oldPassword: result.data.oldPassword,
        newPassword: result.data.newPassword,
      },
      {
        onSuccess: () => {
          setOldPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
          setShowOldPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
          addToast({ message: 'Password updated successfully!', severity: 'success' });
        },
        onError: (err: any) => {
          addToast({
            message: err?.response?.data?.message || 'Failed to update password.',
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

    // Save Sheet ID to user profile and trigger sync API
    updateMeMutation.mutate(
      {
        googleSheetId: sheetId,
      } as any,
      {
        onSuccess: () => {
          updateAuthUser({ googleSheetId: sheetId } as any);
          syncMySheet.mutate(undefined, {
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
          addToast({ message: 'Failed to update your profile with reference sheet.', severity: 'error' });
        },
      }
    );
  };


  // Modern input styling
  const textFieldSx = {
    mb: 3,
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px',
      bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#ffffff',
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
      '&.Mui-disabled': {
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      }
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.88rem',
      color: 'text.secondary',
      '&.Mui-focused': {
        color: tokens.brand.primary,
      },
    },
  };

  const cardSx = {
    p: { xs: 3, md: 4.5 },
    borderRadius: '24px',
    bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : 'rgba(255, 255, 255, 0.8)',
    /* backdropFilter: 'blur(20px)' (removed for performance) */
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)'}`,
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
  };

  return (
    <Box className="animate-fade-in-up" sx={{ p: { xs: 2.5, md: 4.5 }, width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Modern Page Header Banner */}
      <Card
        sx={{
          p: 4,
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : 'rgba(255, 255, 255, 0.8)',
          /* backdropFilter: 'blur(20px)' (removed for performance) */
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)'}`,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          textAlign: { xs: 'center', sm: 'left' },
          gap: 3,
        }}
      >
        <Box
          sx={{
            p: 0.75,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${tokens.brand.primary100} 0%, rgba(93, 26, 137, 0) 100%)`,
            display: 'inline-flex',
          }}
        >
          <Avatar
            sx={{
              width: 84,
              height: 84,
              background: `linear-gradient(135deg, ${tokens.brand.primary} 0%, ${tokens.brand.accent} 100%)`,
              fontWeight: 800,
              fontSize: '1.85rem',
              boxShadow: '0 8px 24px rgba(93, 26, 137, 0.25)',
            }}
          >
            {initials}
          </Avatar>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 850,
              letterSpacing: '-0.02em',
              mb: 0.5,
              background: `linear-gradient(135deg, ${isDarkMode ? '#fff' : tokens.text.primary} 0%, ${tokens.text.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {displayName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Typography variant="caption" sx={{ color: tokens.brand.primary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Manager' : 'Sales Representative'}
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Premium Pill Switcher */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          p: 1,
          flexWrap: 'wrap',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : 'rgba(255, 255, 255, 0.8)',
          borderRadius: '20px',
          width: '100%',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)'}`,
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        {[
          { key: 'profile', label: 'User Profile', icon: <PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} /> },
          { key: 'preferences', label: 'Preferences & Schedule', icon: <ScheduleIcon sx={{ fontSize: 18 }} /> },
          { key: 'ai-providers', label: 'AI Providers', icon: <SmartToyOutlinedIcon sx={{ fontSize: 18 }} /> },
          ...(user?.role === 'user' ? [{ key: 'google-sheet', label: 'Google Sheet Sync', icon: <CloudQueueIcon sx={{ fontSize: 18 }} /> }] : []),
        ].map((tab) => (
          <Button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            startIcon={tab.icon}
            sx={{
              px: { xs: 1.5, sm: 3 },
              py: { xs: 1, sm: 1.25 },
              borderRadius: '14px',
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.86rem' },
              fontWeight: 700,
              whiteSpace: { xs: 'normal', sm: 'nowrap' },
              textAlign: 'center',
              flexShrink: 0,
              color: activeTab === tab.key
                ? '#fff'
                : 'text.secondary',
              bgcolor: activeTab === tab.key
                ? tokens.brand.primary
                : 'transparent',
              boxShadow: activeTab === tab.key
                ? `0 4px 12px ${`color-mix(in srgb, ${tokens.brand.primary} 25%, transparent)`}`
                : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                bgcolor: activeTab === tab.key
                  ? tokens.brand.primaryDark
                  : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                transform: activeTab === tab.key ? 'translateY(-1px)' : 'none',
              }
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* Tab Content */}
      <Box sx={{ width: '100%', position: 'relative' }}>
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Fade in timeout={500}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Card sx={cardSx}>
              <Box component="form" onSubmit={handleProfileSave}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 4, letterSpacing: '-0.015em' }}>
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
                      helperText="Your email is connected to your primary auth login and cannot be modified."
                      FormHelperTextProps={{
                        sx: { color: 'text.secondary', fontSize: '0.74rem', mt: 0.75 }
                      }}
                      sx={textFieldSx}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4, opacity: isDarkMode ? 0.08 : 0.08 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updateMeMutation.isPending}
                    startIcon={updateMeMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      bgcolor: tokens.brand.primary,
                      color: '#fff',
                      fontWeight: 700,
                      px: { xs: 3, sm: 5 },
                      py: 1.4,
                      borderRadius: '14px',
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      fontSize: '0.86rem',
                      boxShadow: `0 4px 14px ${`color-mix(in srgb, ${tokens.brand.primary} 30%, transparent)`}`,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        bgcolor: tokens.brand.primaryLight,
                        boxShadow: `0 6px 20px ${`color-mix(in srgb, ${tokens.brand.primary} 40%, transparent)`}`,
                        transform: 'translateY(-1px)',
                      },
                      '&:active': { transform: 'translateY(1px)' },
                    }}
                  >
                    {updateMeMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </Card>

            <Card sx={cardSx}>
              <Box component="form" onSubmit={handlePasswordChange}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 1, letterSpacing: '-0.015em' }}>
                  Change Password
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                  Update your login password. You will need your current password to confirm the change.
                </Typography>

                <Grid container spacing={3.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Current Password"
                      fullWidth
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      error={!!passwordErrors.oldPassword}
                      helperText={passwordErrors.oldPassword}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowOldPassword((prev) => !prev)}
                              edge="end"
                              aria-label="toggle current password visibility"
                            >
                              {showOldPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} />
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="New Password"
                      fullWidth
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      error={!!passwordErrors.newPassword}
                      helperText={passwordErrors.newPassword || 'Must be at least 8 characters'}
                      FormHelperTextProps={{
                        sx: { color: passwordErrors.newPassword ? undefined : 'text.secondary', fontSize: '0.74rem', mt: 0.75 },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowNewPassword((prev) => !prev)}
                              edge="end"
                              aria-label="toggle new password visibility"
                            >
                              {showNewPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Confirm New Password"
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      error={!!passwordErrors.confirmNewPassword}
                      helperText={passwordErrors.confirmNewPassword}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              edge="end"
                              aria-label="toggle confirm password visibility"
                            >
                              {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4, opacity: isDarkMode ? 0.08 : 0.08 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={changePasswordMutation.isPending}
                    startIcon={changePasswordMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <LockOutlinedIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      bgcolor: tokens.brand.primary,
                      color: '#fff',
                      fontWeight: 700,
                      px: { xs: 3, sm: 5 },
                      py: 1.4,
                      borderRadius: '14px',
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      fontSize: '0.86rem',
                      boxShadow: `0 4px 14px ${`color-mix(in srgb, ${tokens.brand.primary} 30%, transparent)`}`,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        bgcolor: tokens.brand.primaryLight,
                        boxShadow: `0 6px 20px ${`color-mix(in srgb, ${tokens.brand.primary} 40%, transparent)`}`,
                        transform: 'translateY(-1px)',
                      },
                      '&:active': { transform: 'translateY(1px)' },
                    }}
                  >
                    {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </Button>
                </Box>
              </Box>
            </Card>
            </Box>
          </Fade>
        )}

        {/* Preferences & Schedule Tab */}
        {activeTab === 'preferences' && (
          <Fade in timeout={500}>
            <Grid container spacing={4}>
              <Grid item xs={12} lg={6}>
                <Card sx={{ ...cardSx, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 1, letterSpacing: '-0.015em' }}>
                    Notification Preferences
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                    Control how and when you receive alerts from the platform.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {[
                      { key: 'email', label: 'Email Notifications', desc: 'Receive updates directly to your inbox.', icon: <EmailOutlinedIcon /> },
                      { key: 'portal', label: 'In-Portal Alerts', desc: 'Show toast notifications inside the app.', icon: <WebAssetIcon /> },
                      { key: 'kpiAlerts', label: 'KPI Target Alerts', desc: 'Get notified when you miss or hit targets.', icon: <CheckCircleOutlineIcon /> },
                      { key: 'meetingReminders', label: 'Meeting Reminders', desc: 'Alerts 15 mins before upcoming meetings.', icon: <NotificationsActiveOutlinedIcon /> },
                    ].map((pref) => (
                      <Box key={pref.key} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: '16px', bgcolor: isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ color: tokens.brand.primary, display: 'flex' }}>{pref.icon}</Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{pref.label}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{pref.desc}</Typography>
                          </Box>
                        </Box>
                        <Switch
                          color="primary"
                          checked={(notificationPrefs as any)[pref.key]}
                          onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [pref.key]: e.target.checked })}
                        />
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handlePreferencesSave}
                      disabled={updateMeMutation.isPending}
                      sx={{
                        bgcolor: tokens.brand.primary,
                        color: '#fff',
                        fontWeight: 700,
                        px: { xs: 3, sm: 4 },
                        py: 1.25,
                        borderRadius: '12px',
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 4px 14px ${`color-mix(in srgb, ${tokens.brand.primary} 30%, transparent)`}`,
                        '&:hover': { bgcolor: tokens.brand.primaryLight, transform: 'translateY(-1px)' },
                      }}
                    >
                      Save Preferences
                    </Button>
                  </Box>
                </Card>
              </Grid>

              {user?.role !== 'admin' && (
                <Grid item xs={12} lg={6}>
                <Card sx={{ ...cardSx, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 1, letterSpacing: '-0.015em' }}>
                    Active Work Schedule
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                    Your assigned shift timings. Contact an admin to request changes.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      label="Shift Start Time"
                      fullWidth
                      value={user?.shiftStart || '09:00'}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ScheduleIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                    
                    <TextField
                      label="Shift End Time"
                      fullWidth
                      value={user?.shiftEnd || '17:00'}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ScheduleIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />

                    <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.08)' : 'rgba(93, 26, 137, 0.04)', border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.08)'}`, display: 'flex', gap: 1.5 }}>
                      <InfoOutlinedIcon sx={{ color: tokens.brand.primary, fontSize: 20, mt: 0.25 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>
                        Shift timings determine when your attendance time tracker expects you to check in. KPI assignments are also aligned with these active hours.
                      </Typography>
                    </Box>
                  </Box>
                </Card>
                </Grid>
              )}
            </Grid>
          </Fade>
        )}

        {/* AI Providers Tab */}
        {activeTab === 'ai-providers' && (
          <Fade in timeout={500}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Card sx={cardSx}>
                <Box component="form" onSubmit={handleAiKeysSave}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3.5 }}>
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
                      <SmartToyOutlinedIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em', mb: 0.25 }}>
                        AI Providers
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Prefer your own keys for the Work Monitor assistant. Without keys, platform Gemini then Kimi then Grok is used.
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 4, opacity: 0.08 }} />

                  {aiKeysLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress size={32} sx={{ color: tokens.brand.primary }} />
                    </Box>
                  ) : (
                    <>
                      <Alert
                        severity="info"
                        icon={<InfoOutlinedIcon />}
                        sx={{ mb: 3.5, borderRadius: '12px' }}
                      >
                        Keys are stored encrypted and never shown again. Leave a field blank to keep the existing key; use Clear to remove it.
                      </Alert>

                      <FormControl fullWidth sx={{ ...textFieldSx, mb: 3.5 }}>
                        <InputLabel id="preferred-ai-provider-label">Preferred provider</InputLabel>
                        <Select
                          labelId="preferred-ai-provider-label"
                          label="Preferred provider"
                          value={preferredAiProvider}
                          onChange={(e: SelectChangeEvent) =>
                            setPreferredAiProvider(e.target.value as AiProvider | '')
                          }
                          sx={{ borderRadius: '16px' }}
                        >
                          <MenuItem value="">
                            <em>Platform default (Kimi → Grok)</em>
                          </MenuItem>
                          {AI_PROVIDER_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                              {aiKeysStatus?.[opt.value] ? ' · configured' : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Grid container spacing={3}>
                        {AI_KEY_FIELDS.map((field) => {
                          const configured = !!aiKeysStatus?.[field.key] && !keysToClear.has(field.key);
                          const markedClear = keysToClear.has(field.key);
                          return (
                            <Grid item xs={12} md={6} key={field.key}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
                                  {field.label}
                                </Typography>
                                {configured && (
                                  <Chip
                                    size="small"
                                    icon={<CheckCircleOutlineIcon sx={{ fontSize: '16px !important' }} />}
                                    label="Configured"
                                    sx={{
                                      height: 24,
                                      fontWeight: 700,
                                      fontSize: '0.7rem',
                                      bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.15)' : tokens.semantic.successBg,
                                      color: tokens.semantic.success,
                                      '& .MuiChip-icon': { color: tokens.semantic.success },
                                    }}
                                  />
                                )}
                                {markedClear && (
                                  <Chip
                                    size="small"
                                    label="Will clear"
                                    sx={{
                                      height: 24,
                                      fontWeight: 700,
                                      fontSize: '0.7rem',
                                      bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.15)' : tokens.semantic.errorBg,
                                      color: tokens.semantic.error,
                                    }}
                                  />
                                )}
                              </Box>
                              <TextField
                                fullWidth
                                type={showAiKeys[field.key] ? 'text' : 'password'}
                                placeholder={configured ? '••••••••••••' : field.placeholder}
                                value={aiKeyInputs[field.key]}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setAiKeyInputs((prev) => ({ ...prev, [field.key]: value }));
                                  if (value) {
                                    setKeysToClear((prev) => {
                                      const next = new Set(prev);
                                      next.delete(field.key);
                                      return next;
                                    });
                                  }
                                }}
                                autoComplete="new-password"
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                    </InputAdornment>
                                  ),
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          setShowAiKeys((prev) => ({
                                            ...prev,
                                            [field.key]: !prev[field.key],
                                          }))
                                        }
                                        edge="end"
                                        aria-label={`Toggle ${field.label} visibility`}
                                      >
                                        {showAiKeys[field.key] ? (
                                          <VisibilityOff sx={{ fontSize: 18 }} />
                                        ) : (
                                          <Visibility sx={{ fontSize: 18 }} />
                                        )}
                                      </IconButton>
                                      {(configured || markedClear) && (
                                        <IconButton
                                          size="small"
                                          onClick={() => markKeyForClear(field.key)}
                                          edge="end"
                                          aria-label={`Clear ${field.label}`}
                                          sx={{ ml: 0.5 }}
                                        >
                                          <ClearIcon sx={{ fontSize: 18, color: tokens.semantic.error }} />
                                        </IconButton>
                                      )}
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{ ...textFieldSx, mb: 0 }}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={updateAiKeysMutation.isPending}
                          startIcon={
                            updateAiKeysMutation.isPending ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <SaveOutlinedIcon />
                            )
                          }
                          sx={{
                            bgcolor: tokens.brand.primary,
                            color: '#fff',
                            fontWeight: 700,
                            px: 4,
                            py: 1.25,
                            borderRadius: '14px',
                            textTransform: 'none',
                            fontSize: '0.86rem',
                            boxShadow: `0 4px 14px ${`color-mix(in srgb, ${tokens.brand.primary} 30%, transparent)`}`,
                            '&:hover': {
                              bgcolor: tokens.brand.primaryLight,
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          {updateAiKeysMutation.isPending ? 'Saving...' : 'Save AI settings'}
                        </Button>
                      </Box>
                    </>
                  )}
                </Box>
              </Card>
            </Box>
          </Fade>
        )}

        {/* Google Sheet Sync Tab */}
        {activeTab === 'google-sheet' && user?.role === 'user' && (
          <Fade in timeout={500}>
            <Grid container spacing={4}>
              <Grid item xs={12} lg={7}>
                <Card sx={{ ...cardSx, height: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', textAlign: { xs: 'center', sm: 'left' }, gap: 2, mb: 3.5 }}>
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
                        Synchronize external lead directories automatically.
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 4, opacity: isDarkMode ? 0.08 : 0.08 }} />

                  {linkError && (
                    <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3.5, borderRadius: '12px' }}>
                      {linkError}
                    </Alert>
                  )}

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

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1.5 }}>


                    <Button
                      variant="contained"
                      onClick={handleSyncGoogleSheet}
                      disabled={isSyncing}
                      startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : null}
                      sx={{
                        bgcolor: tokens.brand.primary,
                        color: '#fff',
                        fontWeight: 700,
                        px: { xs: 3, sm: 4 },
                        py: 1.25,
                        borderRadius: '14px',
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        fontSize: '0.86rem',
                        boxShadow: `0 4px 14px ${`color-mix(in srgb, ${tokens.brand.primary} 30%, transparent)`}`,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                          bgcolor: tokens.brand.primaryLight,
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      {isSyncing ? 'Syncing...' : 'Connect & Sync'}
                    </Button>
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Card sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Sync Status
                    </Typography>

                    <Box
                      sx={{
                        p: 3,
                        borderRadius: '16px',
                        bgcolor: (user as any)?.googleSheetId
                          ? (isDarkMode ? 'rgba(45, 138, 94, 0.08)' : 'rgba(45, 138, 94, 0.04)')
                          : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
                        border: `1px solid ${
                          (user as any)?.googleSheetId
                            ? (isDarkMode ? 'rgba(45, 138, 94, 0.18)' : 'rgba(45, 138, 94, 0.1)')
                            : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      {(user as any)?.googleSheetId ? (
                        <CheckCircleOutlineIcon sx={{ color: tokens.semantic.success, fontSize: 28 }} />
                      ) : (
                        <CloudQueueIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 0.5 }}>
                          {(user as any)?.googleSheetId ? 'Spreadsheet Sync Active' : 'Offline Mode'}
                        </Typography>
                        {(user as any)?.googleSheetId ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              sx={{ display: 'block', maxWidth: 180 }}
                            >
                              {(user as any).googleSheetId}
                            </Typography>
                            <IconButton
                              component="a"
                              href={`https://docs.google.com/spreadsheets/d/${(user as any).googleSheetId}`}
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

                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: '16px',
                      bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.08)' : 'rgba(93, 26, 137, 0.03)',
                      border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.08)'}`,
                      display: 'flex',
                      gap: 1.5,
                      mt: 'auto',
                    }}
                  >
                    <InfoOutlinedIcon sx={{ color: tokens.brand.primary, fontSize: 18, mt: 0.25 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.5 }}>
                      The sales database processes lead directory synchronizations twice daily automatically. Connecting a sheet enables real-time auto-population across the application.
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Fade>
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
            bgcolor: 'rgba(0,0,0,0.4)',
            /* backdropFilter: 'blur(8px)' (removed for performance) */
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <Card
            sx={{
              p: 5,
              borderRadius: '24px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}`,
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.85)' : 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              maxWidth: 380,
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <CircularProgress
              variant="determinate"
              value={syncProgress}
              size={64}
              thickness={4}
              sx={{ color: tokens.brand.primary, mb: 3 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 1 }}>
              {syncProgress}% Synchronized
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {syncStageText}
            </Typography>
          </Card>
        </Box>
      )}
    </Box>
  );
}
