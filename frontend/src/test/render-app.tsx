import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from '@/app';
import { AuthProvider } from '@/features/auth/auth-provider';

export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
