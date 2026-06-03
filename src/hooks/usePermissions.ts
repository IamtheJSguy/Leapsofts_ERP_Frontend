import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants';

export const usePermissions = () => {
  const { user, isAdmin } = useAuth();

  return useMemo(
    () => ({
      canManageUsers: isAdmin,
      canManageKPIs: isAdmin,
      canApproveKPIChanges: isAdmin,
      canViewAdminDashboard: isAdmin,
      canViewAdminReports: isAdmin,
      canManageSystemSettings: isAdmin,
      canManageLeads: !!user,
      canViewKanban: !!user,
      canUseChat: !!user,
      canScheduleMeetings: !!user,
      canGenerateReports: !!user,
      isAdmin,
      isUser: user?.role === ROLES.USER,
    }),
    [user, isAdmin],
  );
};
