import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface GuestRouteProps {
  children: React.ReactNode;
}

export const GuestRoute = ({ children }: GuestRouteProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasToken = !!localStorage.getItem('accessToken');

  if (isAuthenticated || hasToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
