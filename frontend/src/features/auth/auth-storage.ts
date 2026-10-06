import type { User } from './auth-context';

export interface Session {
  token: string;
  user: User;
}

const SESSION_KEY = 'cvb:session';

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const session = JSON.parse(raw) as Partial<Session>;
    if (typeof session.token !== 'string' || !session.user?.id || !session.user.email) {
      return null;
    }
    return session as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
