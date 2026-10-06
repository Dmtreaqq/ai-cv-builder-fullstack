import { http, HttpResponse } from 'msw';
import type { Credentials } from '@/features/auth/auth-api';
import { validateCredentials } from '@/features/auth/validate-credentials';
import { encodeToken, userFromEmail } from '../auth';

async function startSession({ request }: { request: Request }) {
  const body = (await request.json().catch(() => ({}))) as Partial<Credentials>;
  const credentials = { email: String(body.email ?? ''), password: String(body.password ?? '') };
  const errors = validateCredentials(credentials);
  const firstError = errors.email ?? errors.password;
  if (firstError) {
    return HttpResponse.json({ message: firstError }, { status: 400 });
  }
  return HttpResponse.json({
    token: encodeToken(credentials.email),
    user: userFromEmail(credentials.email),
  });
}

export const authHandlers = [
  http.post('/api/auth/register', startSession),
  http.post('/api/auth/login', startSession),
];
