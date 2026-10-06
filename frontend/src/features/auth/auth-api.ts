import { apiRequest } from '@/lib/api-client';
import type { User } from './auth-context';

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export function loginRequest(credentials: Credentials) {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: credentials });
}

export function registerRequest(credentials: Credentials) {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: credentials });
}

export function meRequest(signal?: AbortSignal) {
  return apiRequest<AuthResponse>('/auth/me', { signal });
}

export function logoutRequest() {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}
