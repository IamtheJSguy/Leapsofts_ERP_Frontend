import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { resolvePermissions } from '@/lib/permissions';
import { ROLES } from '@/lib/constants';

export const usePermissions = () => {
  const { user, isAdmin, isManager, isElevated } = useAuth();

  return useMemo(() => {
    const flags = resolvePermissions(user?.role, user?.department, user?.permissions);

    return {
      ...flags,
      canManageUsers: isElevated,
      canManageKPIs: isElevated,
      canApproveKPIChanges: isElevated,
      canViewAdminDashboard: isElevated,
      canViewAdminReports: isElevated,
      canViewTeamDashboard: flags.accessTeam,
      canManageSystemSettings: flags.manageSystemSettings,
      canManageSalesSettings: flags.manageSalesSettings,
      canViewSystemSettings: flags.manageSystemSettings || flags.manageSalesSettings,
      canViewSalesPage: flags.viewSalesPage,
      canAccessTeam: flags.accessTeam,
      canViewAllAttendance: flags.viewAllAttendance,
      canCreateProjectsAndBoards: flags.createProjectsAndBoards,
      canPromoteRoles: isAdmin,
      canDeactivateUsers: isAdmin,
      canManageLeads: !!user,
      canViewKanban: !!user,
      canUseChat: !!user,
      canScheduleMeetings: !!user,
      canGenerateReports: isElevated,
      isAdmin,
      isManager,
      isElevated,
      isUser: user?.role === ROLES.USER,
    };
  }, [user, isAdmin, isManager, isElevated]);
};
