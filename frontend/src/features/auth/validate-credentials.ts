import type { Credentials } from './auth-api';

export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials({ email, password }: Credentials): CredentialErrors {
  const errors: CredentialErrors = {};
  if (!email.trim()) {
    errors.email = 'Enter your email.';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Enter a valid email, like name@example.com.';
  }
  if (!password) {
    errors.password = 'Enter a password.';
  }
  return errors;
}
