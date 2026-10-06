import type { CookieOptions } from 'express';

export const AUTH_COOKIE = 'access_token';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export function authCookieOptions(production: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: production,
    path: '/',
  };
}

export function sessionCookieOptions(production: boolean): CookieOptions {
  return { ...authCookieOptions(production), maxAge: SESSION_TTL_SECONDS * 1000 };
}
