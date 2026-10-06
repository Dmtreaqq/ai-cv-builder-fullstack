import { apiRequest } from '@/lib/api-client';
import type { Session } from './auth-storage';

export interface Credentials {
  email: string;
  password: string;
}

export function loginRequest(credentials: Credentials) {
  return apiRequest<Session>('/auth/login', { method: 'POST', body: credentials });
}

export function registerRequest(credentials: Credentials) {
  return apiRequest<Session>('/auth/register', { method: 'POST', body: credentials });
}
