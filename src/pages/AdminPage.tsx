import { Typography, Box, Button, useTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { usePermissions } from '@/hooks/usePermissions';
import { SystemSettingsPanel } from '@/components/admin/SystemSettingsPanel';
import { CrmConnectionsPanel } from '@/components/admin/CrmConnectionsPanel';
import { tokens } from '@/styles/tokens';
import { useAdminUsage, useRevokeAdminSessions } from '@/hooks/api/useAdmin';
import { QueryState } from '@/components/common/QueryState';
import { useUIStore } from '@/store/useUIStore';

type AdminTabId = 'users' | 'system' | 'usage';

const AdminPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { canManageUsers, canManageSystemSettings } = usePermissions();

  const tabs = useMemo(() => {
    const list: { id: AdminTabId; label: string; shortLabel: string }[] = [];
    if (canManageUsers) list.push({ id: 'users', label: 'Users List', shortLabel: 'Users' });
    if (canManageSystemSettings) list.push({ id: 'system', label: 'System Settings', shortLabel: 'Settings' });
    if (canManageSystemSettings) list.push({ id: 'usage', label: 'Usage', shortLabel: 'Usage' });
    return list;
  }, [canManageUsers, canManageSystemSettings]);

  const addToast = useUIStore((s) => s.addToast);
  const [tab, setTab] = useState<AdminTabId>(tabs[0]?.id ?? 'users');
  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;
  const { data: usage, isLoading: isUsageLoading, isError: isUsageError, refetch: refetchUsage } = useAdminUsage(
    canManageSystemSettings && activeTab === 'usage',
  );
  const revokeSessions = useRevokeAdminSessions();

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
            width: { xs: '100%', sm: 'fit-content' },
            maxWidth: '100%',
          }}
        >
          {tabs.map((item) => (
            <Button
              key={item.id}
              onClick={() => setTab(item.id)}
              sx={{
                flex: { xs: 1, sm: 'initial' },
                whiteSpace: 'nowrap',
                borderRadius: '16px',
                px: { xs: 1.5, sm: 2.5, md: 3 },
                py: { xs: 0.85, sm: 0.75 },
                bgcolor: activeTab === item.id ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent',
                color: activeTab === item.id ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: { xs: '0.82rem', sm: '0.84rem' },
                '&:hover': {
                  bgcolor: activeTab === item.id ? (isDarkMode ? '#fff' : '#1A1625') : 'rgba(0,0,0,0.05)',
                },
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                {item.shortLabel}
              </Box>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {item.label}
              </Box>
            </Button>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 1 }}>
        {activeTab === 'users' && canManageUsers ? (
          <UserManagementTable />
        ) : activeTab === 'system' && canManageSystemSettings ? (
          <>
            <CrmConnectionsPanel />
            <SystemSettingsPanel readOnly={!canManageSystemSettings} />
          </>
        ) : activeTab === 'usage' && canManageSystemSettings ? (
          <QueryState
            isLoading={isUsageLoading}
            isError={isUsageError}
            onRetry={() => refetchUsage()}
            hasData={!!usage}
          >
            <Box>
              <Typography sx={{ mb: 2 }}>
                Leads {String(usage?.usage?.leads ?? 0)} · Projects {String(usage?.usage?.projects ?? 0)} · Boards{' '}
                {String(usage?.usage?.boards ?? 0)} · Storage {String(usage?.usage?.storageMb ?? 0)} MB · Seats{' '}
                {String((usage as { seats?: { used: number; purchased: number } } | undefined)?.seats?.used ?? '—')}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                disabled={revokeSessions.isPending}
                onClick={() => {
                  revokeSessions.mutate(undefined, {
                    onSuccess: () => {
                      addToast({ message: 'All organization sessions were signed out', severity: 'success' });
                    },
                  });
                }}
              >
                Sign out all sessions
              </Button>
            </Box>
          </QueryState>
        ) : null}
      </Box>
    </Box>
  );
};

export default AdminPage;
