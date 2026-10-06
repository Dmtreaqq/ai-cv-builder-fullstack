import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ApiError } from '@/lib/api-client';
import { makeUser } from '@/test/fixtures';
import { meRequest } from './auth-api';
import { AuthProvider } from './auth-provider';
import { ProtectedRoute } from './protected-route';
import { useAuth } from './use-auth';

vi.mock('./auth-api');

function Status() {
  const { status, user } = useAuth();
  return <p>{user ? `${status}: ${user.email}` : status}</p>;
}

function renderWithSession(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route index element={<Status />} />
          <Route path="/login" element={<p>Login page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<p>Secret page</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthProvider', () => {
  it('restores the session from /auth/me', async () => {
    vi.mocked(meRequest).mockResolvedValue({ user: makeUser() });
    renderWithSession();

    expect(await screen.findByText('authenticated: jordan@example.com')).toBeInTheDocument();
  });

  it('becomes anonymous when /auth/me returns 401', async () => {
    vi.mocked(meRequest).mockRejectedValue(new ApiError(401, 'Log in to continue.'));
    renderWithSession();

    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });

  it('shows a loading state on protected pages until the session is known', async () => {
    let resolve!: (value: { user: ReturnType<typeof makeUser> }) => void;
    vi.mocked(meRequest).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    renderWithSession('/secret');

    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();

    resolve({ user: makeUser() });
    expect(await screen.findByText('Secret page')).toBeInTheDocument();
  });

  it('skips /auth/me when an initial user is given', () => {
    render(
      <MemoryRouter>
        <AuthProvider initialUser={null}>
          <Status />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(meRequest).not.toHaveBeenCalled();
  });
});
