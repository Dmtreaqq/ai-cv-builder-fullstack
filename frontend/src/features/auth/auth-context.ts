import { createContext } from 'react';
import type { Session } from './auth-storage';

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
}

export type AuthAction = { type: 'login'; user: User } | { type: 'logout' };

export interface AuthContextValue extends AuthState {
  login: (session: Session) => void;
  logout: () => void;
}

export function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'login':
      return { user: action.user };
    case 'logout':
      return { user: null };
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null);
