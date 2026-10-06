import { saveSession } from '@/features/auth/auth-storage';
import { encodeToken, userFromEmail } from '@/mocks/auth';
import { saveCv, type StoredCv } from '@/mocks/db';
import { GENERATION_MS } from '@/mocks/generation';

export function signIn(email = 'jordan@example.com') {
  const user = userFromEmail(email);
  saveSession({ token: encodeToken(email), user });
  return user;
}

export function seedCv(ownerId: string, overrides: Partial<StoredCv> = {}) {
  const startedAt = new Date(Date.now() - GENERATION_MS - 1_000).toISOString();
  return saveCv({
    id: 'cv-1',
    ownerId,
    title: 'Senior Backend Engineer CV',
    targetRole: 'Senior Backend Engineer',
    status: 'generating',
    createdAt: startedAt,
    updatedAt: startedAt,
    generationStartedAt: startedAt,
    content: null,
    questions: [],
    sourceText: 'Eight years of backend work.',
    sourceFileName: null,
    retried: false,
    ...overrides,
  });
}
