import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { loginRequest, logoutRequest } from '@/features/auth/auth-api';
import type { User } from '@/features/auth/auth-context';
import { AuthProvider } from '@/features/auth/auth-provider';
import { listCvs } from '@/features/cvs/cvs-api';
import { ApiError } from '@/lib/api-client';
import { makeUser } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';
import { Layout } from './layout';

vi.mock('@/features/auth/auth-api');
vi.mock('@/features/cvs/cvs-api');

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
    renderLayout(makeUser({ email: 'user@example.com' }));
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Register' })).not.toBeInTheDocument();
  });

  it('clears the session cookie and logs the user out', async () => {
    const user = userEvent.setup();
    vi.mocked(logoutRequest).mockResolvedValue(undefined);
    renderLayout(makeUser({ email: 'user@example.com' }));

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(logoutRequest).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  it('still logs out locally when the logout request fails', async () => {
    const user = userEvent.setup();
    vi.mocked(logoutRequest).mockRejectedValue(new ApiError(500, 'Server error'));
    renderLayout(makeUser());

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });

  it('does not carry the protected page over to the next login', async () => {
    const user = userEvent.setup();
    vi.mocked(logoutRequest).mockResolvedValue(undefined);
    vi.mocked(loginRequest).mockResolvedValue({ user: makeUser({ email: 'second@example.com' }) });
    vi.mocked(listCvs).mockResolvedValue([]);
    renderApp('/cvs/new', makeUser({ email: 'first@example.com' }));

    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(
      await screen.findByRole('heading', { name: 'A CV written for the role you want' }),
    ).toBeVisible();

    await user.click(screen.getByRole('link', { name: 'Log in' }));
    await user.type(screen.getByLabelText('Email'), 'second@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Your CVs' })).toBeInTheDocument();
  });
});
