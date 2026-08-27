import { Typography, Box, Button, useTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { usePermissions } from '@/hooks/usePermissions';
import { SystemSettingsPanel } from '@/components/admin/SystemSettingsPanel';
import { SalesSettingsPanel } from '@/components/admin/SalesSettingsPanel';
import { tokens } from '@/styles/tokens';

type AdminTabId = 'users' | 'system' | 'sales';

const AdminPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { canManageUsers, canManageSystemSettings, canManageSalesSettings } = usePermissions();

  const tabs = useMemo(() => {
    const list: { id: AdminTabId; label: string }[] = [];
    if (canManageUsers) list.push({ id: 'users', label: 'Users List' });
    if (canManageSystemSettings) list.push({ id: 'system', label: 'System Settings' });
    if (canManageSalesSettings) list.push({ id: 'sales', label: 'Sales Settings' });
    return list;
  }, [canManageUsers, canManageSystemSettings, canManageSalesSettings]);

  const [tab, setTab] = useState<AdminTabId>(tabs[0]?.id ?? 'users');
  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;

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

      {tabs.length > 0 && (
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
          {tabs.map((item) => (
            <Button
              key={item.id}
              onClick={() => setTab(item.id)}
              sx={{
                borderRadius: '16px',
                px: 3,
                py: 0.75,
                bgcolor: activeTab === item.id ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent',
                color: activeTab === item.id ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.84rem',
                '&:hover': {
                  bgcolor: activeTab === item.id ? (isDarkMode ? '#fff' : '#1A1625') : 'rgba(0,0,0,0.05)',
                },
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 1 }}>
        {activeTab === 'users' && canManageUsers ? (
          <UserManagementTable />
        ) : activeTab === 'system' && canManageSystemSettings ? (
          <SystemSettingsPanel readOnly={!canManageSystemSettings} />
        ) : activeTab === 'sales' && canManageSalesSettings ? (
          <SalesSettingsPanel readOnly={!canManageSalesSettings} />
        ) : null}
      </Box>
    </Box>
  );
};

export default AdminPage;
