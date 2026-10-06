import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '@/lib/api-client';
import { meRequest } from './auth-api';
import { AuthContext, authReducer, type AuthState, type User } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

function initialState(user: User | null | undefined): AuthState {
  if (user === undefined) {
    return { status: 'loading', user: null };
  }
  return user ? { status: 'authenticated', user } : { status: 'anonymous', user: null };
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialUser, initialState);
  const restoreSession = initialUser === undefined;

  useEffect(() => {
    if (!restoreSession) {
      return;
    }
    const controller = new AbortController();
    meRequest(controller.signal).then(
      ({ user }) => dispatch({ type: 'login', user }),
      () => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'logout' });
        }
      },
    );
    return () => controller.abort();
  }, [restoreSession]);

  const login = useCallback((user: User) => dispatch({ type: 'login', user }), []);
  const logout = useCallback(() => dispatch({ type: 'logout' }), []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
