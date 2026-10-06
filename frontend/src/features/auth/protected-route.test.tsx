import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './auth-provider';
import type { User } from './auth-context';
import { ProtectedRoute } from './protected-route';

function renderProtected(initialUser: User | null) {
  render(
    <MemoryRouter initialEntries={['/secret']}>
      <AuthProvider initialUser={initialUser}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<p>Secret page</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects an unauthenticated user to /login', () => {
    renderProtected(null);
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });

  it('renders the child route for an authenticated user', () => {
    renderProtected({ id: '1', email: 'user@example.com' });
    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });
});
