import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { getSanitizedRedirectUrl } from '@/utils/redirect';

interface GuestRouteProps {
  children: React.ReactNode;
}

export const GuestRoute = ({ children }: GuestRouteProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasToken = !!localStorage.getItem('accessToken');
  const [searchParams] = useSearchParams();

  if (isAuthenticated || hasToken) {
    const rawRedirect = searchParams.get('redirect') || searchParams.get('returnUrl');
    const targetUrl = getSanitizedRedirectUrl(rawRedirect);
    return <Navigate to={targetUrl} replace />;
  }

  return <>{children}</>;
};
