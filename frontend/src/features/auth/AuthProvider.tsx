import { useMemo, useReducer, type ReactNode } from 'react';
import { AuthContext, authReducer, type User } from './authContext.ts';

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, { user: initialUser });

  const value = useMemo(
    () => ({
      ...state,
      login: (user: User) => dispatch({ type: 'login', user }),
      logout: () => dispatch({ type: 'logout' }),
    }),
    [state],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
