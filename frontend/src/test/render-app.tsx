import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from '@/app';
import type { User } from '@/features/auth/auth-context';
import { AuthProvider } from '@/features/auth/auth-provider';

export function renderApp(path: string, user: User | null = null) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider initialUser={user}>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
