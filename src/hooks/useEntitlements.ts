import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

export type OrgModuleKey =
  | 'salesModule'
  | 'screenshotMonitoring'
  | 'appUsageTelemetry'
  | 'chat'
  | 'projectsAndBoards'
  | 'scheduledReports'
  | 'googleSheetsSync'
  | 'desktopApp'
  | 'screenshotsEnabled';

export type OrgModuleFlags = Record<OrgModuleKey, boolean>;

export const DEFAULT_ORG_MODULE_FLAGS: OrgModuleFlags = {
  salesModule: true,
  screenshotMonitoring: true,
  appUsageTelemetry: true,
  chat: true,
  projectsAndBoards: true,
  scheduledReports: true,
  googleSheetsSync: true,
  desktopApp: true,
  screenshotsEnabled: true,
};

export const ORG_ENTITLEMENTS_QUERY_KEY = ['org-entitlements'] as const;

export const useOrgEntitlements = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const organizationId = useAuthStore((s) => s.user?.organizationId);

  return useQuery({
    queryKey: [...ORG_ENTITLEMENTS_QUERY_KEY, organizationId],
    queryFn: () =>
      api.get<{ data: OrgModuleFlags }>('/organizations/me/entitlements').then((r) => r.data.data),
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
};

/** Live org module flags. Defaults to all-on until the first successful fetch to avoid empty nav flash. */
export const useEntitlements = (): OrgModuleFlags => {
  const { data, isSuccess } = useOrgEntitlements();
  if (isSuccess && data) return { ...DEFAULT_ORG_MODULE_FLAGS, ...data };
  return DEFAULT_ORG_MODULE_FLAGS;
};
