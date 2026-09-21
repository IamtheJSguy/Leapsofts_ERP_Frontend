import { Typography, Box, Button, useTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { usePermissions } from '@/hooks/usePermissions';
import { SystemSettingsPanel } from '@/components/admin/SystemSettingsPanel';
import { SalesSettingsPanel } from '@/components/admin/SalesSettingsPanel';
import { tokens } from '@/styles/tokens';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useUIStore } from '@/store/useUIStore';

type AdminTabId = 'users' | 'system' | 'sales' | 'usage';

const AdminPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { canManageUsers, canManageSystemSettings, canManageSalesSettings } = usePermissions();

  const tabs = useMemo(() => {
    const list: { id: AdminTabId; label: string }[] = [];
    if (canManageUsers) list.push({ id: 'users', label: 'Users List' });
    if (canManageSystemSettings) list.push({ id: 'system', label: 'System Settings' });
    if (canManageSalesSettings) list.push({ id: 'sales', label: 'Sales Settings' });
    if (canManageSystemSettings) list.push({ id: 'usage', label: 'Usage' });
    return list;
  }, [canManageUsers, canManageSystemSettings, canManageSalesSettings]);

  const addToast = useUIStore((s) => s.addToast);
  const { data: usage } = useQuery({
    queryKey: ['admin', 'usage'],
    enabled: canManageSystemSettings,
    queryFn: async () => {
      const res = await api.get('/admin/usage');
      return res.data.data as { usage: Record<string, number | string | null> };
    },
  });

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
        ) : activeTab === 'usage' && canManageSystemSettings ? (
          <Box>
            <Typography sx={{ mb: 2 }}>
              Leads {String(usage?.usage?.leads ?? 0)} · Projects {String(usage?.usage?.projects ?? 0)} · Boards{' '}
              {String(usage?.usage?.boards ?? 0)} · Storage {String(usage?.usage?.storageMb ?? 0)} MB · Seats{' '}
              {String((usage as { seats?: { used: number; purchased: number } } | undefined)?.seats?.used ?? '—')}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={async () => {
                await api.post('/admin/sessions/revoke', {});
                addToast({ message: 'All organization sessions were signed out', severity: 'success' });
              }}
            >
              Sign out all sessions
            </Button>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default AdminPage;
