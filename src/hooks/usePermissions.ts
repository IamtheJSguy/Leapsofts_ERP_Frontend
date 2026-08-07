import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants';

export const usePermissions = () => {
  const { user, isAdmin, isManager, isElevated } = useAuth();

  return useMemo(
    () => ({
      canManageUsers: isElevated,
      canManageKPIs: isElevated,
      canApproveKPIChanges: isElevated,
      canViewAdminDashboard: isElevated,
      canViewAdminReports: isElevated,
      canViewTeamDashboard: isElevated,
      canManageSystemSettings: isAdmin,
      canManageSalesSettings: isElevated,
      canViewSystemSettings: isElevated,
      canPromoteRoles: isAdmin,
      canManageLeads: !!user,
      canViewKanban: !!user,
      canUseChat: !!user,
      canScheduleMeetings: !!user,
      canGenerateReports: isElevated,
      isAdmin,
      isManager,
      isElevated,
      isUser: user?.role === ROLES.USER,
    }),
    [user, isAdmin, isManager, isElevated],
  );
};
