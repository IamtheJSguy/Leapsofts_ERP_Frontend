import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/lib/constants';
import type { Role } from '@/types';

export const useAuth = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isUser = user?.role === ROLES.USER;
  const isElevated = isAdmin || isManager;
  const hasRole = (role: Role) => user?.role === role;
  return { user, isAuthenticated, isAdmin, isManager, isUser, isElevated, hasRole, clearAuth };
};
