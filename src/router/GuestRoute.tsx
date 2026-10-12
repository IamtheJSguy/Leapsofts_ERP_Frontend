import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { getPostLoginRedirectPath } from '@/utils/navigation';

interface GuestRouteProps {
  children: React.ReactNode;
}

export const GuestRoute = ({ children }: GuestRouteProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasToken = !!localStorage.getItem('accessToken');
  const location = useLocation();

  if (isAuthenticated || hasToken) {
    const destination = getPostLoginRedirectPath(location.state?.from);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};
