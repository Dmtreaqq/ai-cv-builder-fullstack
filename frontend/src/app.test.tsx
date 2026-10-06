import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from './app';
import type { User } from '@/features/auth/auth-context';
import { AuthProvider } from '@/features/auth/auth-provider';

function renderAt(path: string, initialUser: User | null = null) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider initialUser={initialUser}>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('App routes', () => {
  it.each([
    ['/', 'A CV written for the role you want'],
    ['/login', 'Log in'],
    ['/register', 'Register'],
    ['/does-not-exist', '404 – Page not found'],
  ])('renders %s', (path, heading) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });
});

describe('Landing hero', () => {
  it('links the CTA to registration when logged out', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Build my CV' })).toHaveAttribute('href', '/register');
  });

  it('shows a coming-soon note instead of the CTA when signed in', () => {
    renderAt('/', { id: '1', email: 'user@example.com' });
    expect(screen.getByText('CV creation is coming soon.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Build my CV' })).not.toBeInTheDocument();
  });
});
