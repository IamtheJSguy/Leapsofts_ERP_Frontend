import { Typography, Box, Button, useTheme } from '@mui/material';
import { useState } from 'react';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { usePermissions } from '@/hooks/usePermissions';
import { SystemSettingsPanel } from '@/components/admin/SystemSettingsPanel';
import { tokens } from '@/styles/tokens';

const AdminPage = () => {
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { canManageSystemSettings } = usePermissions();

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.025em',
            mb: 0.5,
            color: isDarkMode ? '#fff' : tokens.text.primary,
          }}
        >
          {canManageSystemSettings ? 'Admin Panel' : 'Management Panel'}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
            fontWeight: 500,
            fontSize: '0.92rem',
          }}
        >
          Manage user permissions, security settings, and configure system operations.
        </Typography>
      </Box>

      {/* Premium Segmented Flat Tab Toggler */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: '20px',
          p: 0.5,
          gap: 0.5,
          mb: 4,
          width: 'fit-content',
        }}
      >
        <Button
          onClick={() => setTab(0)}
          sx={{
            borderRadius: '16px',
            px: 3,
            py: 0.75,
            bgcolor: tab === 0 ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent',
            color: tab === 0 ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.84rem',
            '&:hover': {
              bgcolor: tab === 0 ? (isDarkMode ? '#fff' : '#1A1625') : 'rgba(0,0,0,0.05)',
            },
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          Users List
        </Button>
        <Button
          onClick={() => setTab(1)}
          sx={{
            borderRadius: '16px',
            px: 3,
            py: 0.75,
            bgcolor: tab === 1 ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent',
            color: tab === 1 ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.84rem',
            '&:hover': {
              bgcolor: tab === 1 ? (isDarkMode ? '#fff' : '#1A1625') : 'rgba(0,0,0,0.05)',
            },
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          System Settings
        </Button>
      </Box>

      {/* Render Active Config Panel */}
      <Box sx={{ mt: 1 }}>
        {tab === 0 ? <UserManagementTable /> : <SystemSettingsPanel readOnly={!canManageSystemSettings} />}
      </Box>
    </Box>
  );
};

export default AdminPage;
