import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './use-auth';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <p role="status" className="py-24 text-center text-sm text-muted-foreground">
        Loading…
      </p>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
