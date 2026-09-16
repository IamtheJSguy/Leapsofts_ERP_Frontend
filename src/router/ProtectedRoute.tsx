import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { resolvePermissions, type PermissionKey } from '@/lib/permissions';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  requirePermission?: PermissionKey | PermissionKey[];
  children: React.ReactNode;
}

export const ProtectedRoute = ({
  allowedRoles,
  requirePermission,
  children,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated && !localStorage.getItem('accessToken')) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (user && requirePermission) {
    const resolved = resolvePermissions(user.role, user.department, user.permissions);
    const keys = Array.isArray(requirePermission) ? requirePermission : [requirePermission];
    const allowed = keys.some((key) => resolved[key]);
    if (!allowed) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
