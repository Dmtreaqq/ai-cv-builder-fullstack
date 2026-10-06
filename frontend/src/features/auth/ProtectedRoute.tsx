import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './useAuth.ts';

export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
