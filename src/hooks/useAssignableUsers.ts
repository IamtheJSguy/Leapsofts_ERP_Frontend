import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyTeam } from '@/hooks/api/useTeam';
import { useUsers } from '@/hooks/api/useUsers';
import type { User } from '@/types';

/** Users that the current actor may assign KPIs to. Managers are limited to their team. */
export const useAssignableUsers = () => {
  const { isAdmin, isManager } = useAuth();
  const { data: users = [] } = useUsers();
  const teamQuery = useMyTeam({ enabled: isManager });

  return useMemo((): User[] => {
    if (isAdmin) {
      return users.filter((u) => u.role === 'user' || u.role === 'manager');
    }

    if (isManager) {
      const members = teamQuery.data?.members ?? [];
      return members
        .filter((m) => m.role === 'user' && m.isActive !== false)
        .map(
          (m): User => ({
            _id: m._id,
            email: m.email,
            firstName: m.firstName,
            lastName: m.lastName,
            role: 'user',
            jobTitle: m.jobTitle,
            department: m.department,
            isActive: m.isActive,
          }),
        );
    }

    return users.filter((u) => u.role === 'user');
  }, [isAdmin, isManager, users, teamQuery.data?.members]);
};
