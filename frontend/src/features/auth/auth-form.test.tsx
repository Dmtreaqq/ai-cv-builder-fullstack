import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render-app';
import { loadSession } from './auth-storage';

describe('AuthForm', () => {
  it('validates the email before calling the API', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Enter a valid email, like name@example.com.')).toBeInTheDocument();
    expect(screen.getByText('Enter a password.')).toBeInTheDocument();
    expect(loadSession()).toBeNull();
  });

  it('stores the session and lands on the dashboard after logging in', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'Jordan@Example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Your CVs' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No CVs yet' })).toBeInTheDocument();
    expect(loadSession()?.user.email).toBe('jordan@example.com');
  });
});
