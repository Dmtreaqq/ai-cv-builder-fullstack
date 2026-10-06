import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="font-serif text-xl tracking-tight whitespace-nowrap">
            AI CV Builder
          </Link>
          <nav aria-label="Account" className="flex min-w-0 items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <span className="truncate text-sm text-muted-foreground">{user.email}</span>
                <Button variant="ghost" onClick={handleLogout}>
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
