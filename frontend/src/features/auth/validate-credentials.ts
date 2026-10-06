import type { Credentials } from './auth-api';

export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(
  { email, password }: Credentials,
  mode: 'login' | 'register' = 'login',
): CredentialErrors {
  const errors: CredentialErrors = {};
  if (!email.trim()) {
    errors.email = 'Enter your email.';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Enter a valid email, like name@example.com.';
  }
  if (!password) {
    errors.password = 'Enter a password.';
  } else if (mode === 'register' && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (mode === 'register' && password.length > MAX_PASSWORD_LENGTH) {
    errors.password = `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  return errors;
}
