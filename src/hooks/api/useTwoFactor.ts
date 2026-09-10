import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface TwoFactorSetupData {
  qrDataUrl: string;
  secret: string;
  otpauthUrl: string;
  email: string;
}

export interface TwoFactorSessionData {
  user: unknown;
  accessToken: string;
  backupCodes?: string[];
}

export const twoFactorApi = {
  setup: (tempToken: string) =>
    api.post<{ data: TwoFactorSetupData }>('/auth/2fa/setup', { tempToken }),
  verifySetup: (tempToken: string, code: string) =>
    api.post<{ data: TwoFactorSessionData }>('/auth/2fa/verify-setup', { tempToken, code }),
  verifyLogin: (tempToken: string, code: string) =>
    api.post<{ data: TwoFactorSessionData }>('/auth/2fa/verify-login', { tempToken, code }),
  regenerateBackupCodes: (code: string) =>
    api.post<{ data: { backupCodes: string[] } }>('/auth/2fa/regenerate-backup-codes', { code }),
  adminReset: (userId: string) => api.delete(`/users/${userId}/2fa`),
  enrollSetup: () => api.post<{ data: TwoFactorSetupData }>('/auth/2fa/enroll'),
  enrollVerify: (code: string) =>
    api.post<{ data: { backupCodes: string[] } }>('/auth/2fa/enroll/verify', { code }),
};

export const useTwoFactorSetup = (tempToken: string | undefined) =>
  useQuery({
    queryKey: ['2fa-setup', tempToken],
    queryFn: () => twoFactorApi.setup(tempToken!).then((r) => r.data.data),
    enabled: Boolean(tempToken),
    retry: false,
    staleTime: Infinity,
  });

export const useTwoFactorVerifySetup = () =>
  useMutation({
    mutationFn: ({ tempToken, code }: { tempToken: string; code: string }) =>
      twoFactorApi.verifySetup(tempToken, code).then((r) => r.data.data),
  });

export const useTwoFactorVerifyLogin = () =>
  useMutation({
    mutationFn: ({ tempToken, code }: { tempToken: string; code: string }) =>
      twoFactorApi.verifyLogin(tempToken, code).then((r) => r.data.data),
  });

export const useRegenerateBackupCodes = () =>
  useMutation({
    mutationFn: (code: string) => twoFactorApi.regenerateBackupCodes(code).then((r) => r.data.data),
  });

export const useEnrollTwoFactorSetup = (enabled: boolean) =>
  useQuery({
    queryKey: ['2fa-enroll'],
    queryFn: () => twoFactorApi.enrollSetup().then((r) => r.data.data),
    enabled,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

export const useEnrollTwoFactorVerify = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => twoFactorApi.enrollVerify(code).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.removeQueries({ queryKey: ['2fa-enroll'] });
    },
  });
};

export const useAdminResetTwoFactor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => twoFactorApi.adminReset(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
