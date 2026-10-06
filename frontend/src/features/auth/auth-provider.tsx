import { useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '@/lib/api-client';
import { AuthContext, authReducer, type User } from './auth-context';
import { clearSession, loadSession, saveSession, type Session } from './auth-storage';

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialUser, (user) => ({
    user: user === undefined ? (loadSession()?.user ?? null) : user,
  }));

  const value = useMemo(
    () => ({
      ...state,
      login: (session: Session) => {
        saveSession(session);
        dispatch({ type: 'login', user: session.user });
      },
      logout: () => {
        clearSession();
        dispatch({ type: 'logout' });
      },
    }),
    [state],
  );

  useEffect(() => {
    setUnauthorizedHandler(value.logout);
    return () => setUnauthorizedHandler(null);
  }, [value.logout]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
