import { Box, Button, Card, CardContent, Chip, Stack, Typography, useTheme } from '@mui/material';
import { useEffect, useMemo } from 'react';
import {
  CRM_CONNECTED_EVENT,
  type CrmProvider,
  openCrmOAuthPopup,
  refreshCrmConnections,
  useCrmAuthUrl,
  useCrmConnections,
  useDisconnectCrm,
  useSyncCrm,
} from '@/hooks/api/useCrm';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';

const PROVIDERS: { id: CrmProvider; label: string; description: string }[] = [
  { id: 'hubspot', label: 'HubSpot', description: 'Sync contacts with HubSpot CRM.' },
  { id: 'salesforce', label: 'Salesforce', description: 'Sync contacts with Salesforce.' },
  { id: 'zoho', label: 'Zoho CRM', description: 'Sync contacts with Zoho CRM.' },
];

export const CrmConnectionsPanel = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const entitlements = useEntitlements();
  const enabled = entitlements.crmSync;
  const addToast = useUIStore((s) => s.addToast);
  const { data: connections = [], isLoading } = useCrmConnections(enabled);
  const authUrl = useCrmAuthUrl();
  const disconnect = useDisconnectCrm();
  const sync = useSyncCrm();

  const byProvider = useMemo(
    () => new Map(connections.map((row) => [row.provider, row])),
    [connections],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === CRM_CONNECTED_EVENT) refreshCrmConnections();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === CRM_CONNECTED_EVENT) refreshCrmConnections();
    };
    window.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const connect = async (provider: CrmProvider) => {
    try {
      const result = await authUrl.mutateAsync(provider);
      if (result.stub) {
        refreshCrmConnections();
        addToast({ message: `${provider} connected (dev stub).`, severity: 'success' });
        return;
      }
      openCrmOAuthPopup(result.url);
    } catch {
      addToast({ message: `Could not start ${provider} connection.`, severity: 'error' });
    }
  };

  if (!enabled) {
    return (
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>CRM connectors</Typography>
          <Typography variant="body2" color="text.secondary">
            CRM sync is not enabled for your organization. Contact your platform admin to turn on the crmSync entitlement.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
        CRM connectors
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Connect HubSpot, Salesforce, or Zoho once per organization. Contacts import into Leapsoft leads only (CRM → ERP). Changes in the ERP are not sent back to the CRM.
      </Typography>
      <Stack spacing={2}>
        {PROVIDERS.map((item) => {
          const row = byProvider.get(item.id);
          const connected = row?.connected;
          return (
            <Card key={item.id} sx={{ borderRadius: 3, border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : tokens.surface.border}` }}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
                      <Chip
                        size="small"
                        label={connected ? 'Connected' : 'Not connected'}
                        color={connected ? 'success' : 'default'}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                    {row?.accountLabel && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Account: {row.accountLabel}
                      </Typography>
                    )}
                    {row?.lastSyncAt && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Last sync: {new Date(row.lastSyncAt).toLocaleString()}
                      </Typography>
                    )}
                    {row?.lastError && (
                      <Typography variant="caption" color="error" display="block">
                        {row.lastError}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    {connected ? (
                      <>
                        <Button
                          variant="outlined"
                          disabled={sync.isPending || isLoading}
                          onClick={() => sync.mutate(item.id, {
                            onSuccess: () => addToast({ message: 'CRM sync queued.', severity: 'success' }),
                          })}
                        >
                          Sync now
                        </Button>
                        <Button
                          variant="text"
                          color="error"
                          disabled={disconnect.isPending}
                          onClick={() => disconnect.mutate(item.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        disabled={authUrl.isPending}
                        onClick={() => connect(item.id)}
                      >
                        Connect
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};
