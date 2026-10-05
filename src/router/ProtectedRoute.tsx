import { useIsRestoring } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/common/PageLoader';
import { useAuthStore } from '@/store/useAuthStore';
import { resolvePermissions, type PermissionKey } from '@/lib/permissions';
import { useEntitlements, useOrgEntitlements, type OrgModuleKey } from '@/hooks/useEntitlements';
import { useMe } from '@/hooks/api/useUsers';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  requirePermission?: PermissionKey | PermissionKey[];
  requireEntitlement?: OrgModuleKey;
  children: React.ReactNode;
}

export const ProtectedRoute = ({
  allowedRoles,
  requirePermission,
  requireEntitlement,
  children,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const entitlements = useEntitlements();
  const entitlementsQuery = useOrgEntitlements();
  const meQuery = useMe();
  const isRestoringQueryCache = useIsRestoring();
  const location = useLocation();

  if (!isAuthenticated && !localStorage.getItem('accessToken')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Persisted React Query cache (incl. org entitlements) rehydrates async on hard reload.
  if (isRestoringQueryCache) {
    return <PageLoader />;
  }

  if (user && requireEntitlement && entitlementsQuery.isPending) {
    return <PageLoader />;
  }

  if (user && requirePermission && meQuery.isPending) {
    return <PageLoader />;
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

  if (user && requireEntitlement && entitlements[requireEntitlement] === false) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
