import { createContext } from 'react';

export interface User {
  id: string;
  email: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
}

export type AuthAction = { type: 'login'; user: User } | { type: 'logout' };

export interface AuthContextValue extends AuthState {
  login: (user: User) => void;
  logout: () => void;
}

export function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'login':
      return { status: 'authenticated', user: action.user };
    case 'logout':
      return { status: 'anonymous', user: null };
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null);
