import { startTransition } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { logoutRequest } from '@/features/auth/auth-api';
import { useAuth } from '@/features/auth/use-auth';

export function Layout() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // The cookie expires on its own; logging out locally is what matters here.
    }
    // One transition, so ProtectedRoute never sees a logged-out user on this page and records it as `from`.
    startTransition(() => {
      navigate('/');
      logout();
    });
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="font-serif text-xl tracking-tight whitespace-nowrap">
            AI CV Builder
          </Link>
          <nav aria-label="Account" className="flex min-w-0 items-center gap-1 sm:gap-2">
            {status === 'loading' ? null : user ? (
              <>
                <span className="hidden truncate text-sm text-muted-foreground md:inline">
                  {user.email}
                </span>
                <Button asChild variant="ghost">
                  <NavLink to="/cvs" end>
                    My CVs
                  </NavLink>
                </Button>
                <Button variant="ghost" onClick={() => void handleLogout()}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <NavLink to="/login">Log in</NavLink>
                </Button>
                <Button asChild>
                  <NavLink to="/register">Register</NavLink>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
