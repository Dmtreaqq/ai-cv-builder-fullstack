import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { listCvs } from '@/features/cvs/cvs-api';
import { ApiError } from '@/lib/api-client';
import { makeUser } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';
import { loginRequest, registerRequest } from './auth-api';

vi.mock('./auth-api');
vi.mock('@/features/cvs/cvs-api');

describe('AuthForm', () => {
  it('validates the email before calling the API', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Enter a valid email, like name@example.com.')).toBeInTheDocument();
    expect(screen.getByText('Enter a password.')).toBeInTheDocument();
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it('logs in and lands on the dashboard', async () => {
    const user = userEvent.setup();
    vi.mocked(loginRequest).mockResolvedValue({ user: makeUser() });
    vi.mocked(listCvs).mockResolvedValue([]);
    renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'Jordan@Example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Your CVs' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No CVs yet' })).toBeInTheDocument();
    expect(loginRequest).toHaveBeenCalledWith({ email: 'Jordan@Example.com', password: 'secret' });
    expect(screen.getByText('jordan@example.com')).toBeInTheDocument();
  });

  it('shows the server message when login fails', async () => {
    const user = userEvent.setup();
    vi.mocked(loginRequest).mockRejectedValue(new ApiError(401, 'Invalid email or password.'));
    renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'jordan@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('requires 8 characters in the password when registering', async () => {
    const user = userEvent.setup();
    renderApp('/register');

    await user.type(screen.getByLabelText('Email'), 'jordan@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(registerRequest).not.toHaveBeenCalled();
  });
});
