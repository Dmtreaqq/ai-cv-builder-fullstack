import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { User } from '@/features/auth/auth-context';
import { AuthProvider } from '@/features/auth/auth-provider';
import { renderApp } from '@/test/render-app';
import { signIn } from '@/test/seed';
import { Layout } from './layout';

function renderLayout(initialUser: User | null) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider initialUser={initialUser}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<p>Home page</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  it('shows Log in and Register links when logged out', () => {
    renderLayout(null);
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  });

  it('shows the email and a Log out button when signed in', () => {
    renderLayout({ id: '1', email: 'user@example.com' });
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Register' })).not.toBeInTheDocument();
  });

  it('logs the user out', async () => {
    const user = userEvent.setup();
    renderLayout({ id: '1', email: 'user@example.com' });

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  it('does not carry the protected page over to the next login', async () => {
    const user = userEvent.setup();
    signIn('first@example.com');
    renderApp('/cvs/new');

    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(
      screen.getByRole('heading', { name: 'A CV written for the role you want' }),
    ).toBeVisible();

    await user.click(screen.getByRole('link', { name: 'Log in' }));
    await user.type(screen.getByLabelText('Email'), 'second@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Your CVs' })).toBeInTheDocument();
  });
});
