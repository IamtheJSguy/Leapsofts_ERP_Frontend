import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';

export const CRM_CONNECTED_EVENT = 'leapsofts-crm-connected';
const CRM_RETURN_KEY = 'leapsofts-crm-return';

export type CrmProvider = 'hubspot' | 'salesforce' | 'zoho';

export type CrmConnectionView = {
  provider: CrmProvider;
  connected: boolean;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
  lastSyncSummary: {
    imported: number;
    updated: number;
    pushed: number;
    skipped: number;
    ambiguous: number;
  } | null;
  accountLabel: string | null;
};

export const refreshCrmConnections = () => {
  void queryClient.invalidateQueries({ queryKey: ['crmConnections'] });
};

export const openCrmOAuthPopup = (url: string) => {
  localStorage.setItem(CRM_RETURN_KEY, window.location.pathname + window.location.search);
  const popup = window.open(url, 'leapsofts-crm-oauth', 'width=600,height=700');
  popup?.focus();
  return popup;
};

export const consumeCrmReturnPath = () => {
  const path = localStorage.getItem(CRM_RETURN_KEY) || '/admin';
  localStorage.removeItem(CRM_RETURN_KEY);
  return path.startsWith('/') ? path : '/admin';
};

const crmApi = {
  list: () => api.get<{ data: { connections: CrmConnectionView[] } }>('/crm/connections'),
  authUrl: (provider: CrmProvider) => api.get<{ data: { url: string; stub?: boolean } }>(`/crm/${provider}/auth`),
  disconnect: (provider: CrmProvider) => api.delete(`/crm/${provider}`),
  sync: (provider?: CrmProvider) =>
    provider ? api.post(`/crm/${provider}/sync`) : api.post('/crm/sync'),
};

export const useCrmConnections = (enabled: boolean) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['crmConnections', organizationId],
    enabled,
    queryFn: () => crmApi.list().then((r) => r.data.data.connections),
  });
};

export const useCrmAuthUrl = () =>
  useMutation({
    mutationFn: (provider: CrmProvider) => crmApi.authUrl(provider).then((r) => r.data.data),
  });

export const useDisconnectCrm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: CrmProvider) => crmApi.disconnect(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crmConnections'] }),
  });
};

export const useSyncCrm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider?: CrmProvider) => crmApi.sync(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crmConnections'] }),
  });
};
