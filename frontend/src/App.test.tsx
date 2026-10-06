import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from './App.tsx';
import { AuthProvider } from './features/auth/AuthProvider.tsx';

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('App routes', () => {
  it.each([
    ['/', 'AI CV Builder'],
    ['/login', 'Log in'],
    ['/register', 'Register'],
    ['/does-not-exist', '404 – Page not found'],
  ])('renders %s', (path, heading) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });
});
