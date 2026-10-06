import type { User } from '@/features/auth/auth-context';

const TOKEN_PREFIX = 'mock.';

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function encodeToken(email: string) {
  return TOKEN_PREFIX + toBase64Url(normalizeEmail(email));
}

export function decodeToken(token: string): string | null {
  if (!token.startsWith(TOKEN_PREFIX)) {
    return null;
  }
  try {
    const email = fromBase64Url(token.slice(TOKEN_PREFIX.length));
    return email.includes('@') ? email : null;
  } catch {
    return null;
  }
}

// FNV-1a: a stable, dependency-free hash so the same email always maps to the same user id.
export function userIdFromEmail(email: string) {
  let hash = 0x811c9dc5;
  for (const char of normalizeEmail(email)) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return `u_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function userFromEmail(email: string): User {
  const normalized = normalizeEmail(email);
  return { id: userIdFromEmail(normalized), email: normalized };
}

export function requireUser(request: Request): User | null {
  const header = request.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const email = token ? decodeToken(token) : null;
  return email ? userFromEmail(email) : null;
}
