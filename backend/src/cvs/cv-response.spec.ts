import { describe, expect, it } from '@jest/globals';
import { Cv } from './cv.entity.js';
import { toCvResponse, toCvSummary } from './cv-response.js';

function storedCv(overrides: Partial<Cv> = {}): Cv {
  return Object.assign(new Cv(), {
    id: 'cv-1',
    userId: 'user-1',
    title: 'Backend CV',
    targetRole: 'Backend Engineer',
    status: 'generating',
    stage: 'drafting',
    error: null,
    sourceText: 'private background',
    sourcePdf: Buffer.from('%PDF-'),
    sourceFileName: 'private.pdf',
    content: null,
    questions: [],
    generationStartedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  });
}

describe('toCvResponse', () => {
  it('never leaks the source fields', () => {
    const response = toCvResponse(storedCv());

    expect(response).not.toHaveProperty('sourceText');
    expect(response).not.toHaveProperty('sourcePdf');
    expect(response).not.toHaveProperty('sourceFileName');
    expect(response).not.toHaveProperty('userId');
    expect(JSON.stringify(response)).not.toContain('private');
  });

  it('adds the generation progress while generating', () => {
    expect(toCvResponse(storedCv())).toMatchObject({
      ownerId: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      generation: {
        stage: 'drafting',
        stages: ['reading', 'analyzing', 'drafting', 'tailoring', 'reviewing'],
      },
    });
  });

  it('includes the error only for a failed CV', () => {
    const failed = toCvResponse(storedCv({ status: 'failed', stage: null, error: 'Try again.' }));
    const ready = toCvResponse(storedCv({ status: 'ready', stage: null, error: 'stale' }));

    expect(failed.error).toBe('Try again.');
    expect(failed).not.toHaveProperty('generation');
    expect(ready).not.toHaveProperty('error');
  });
});

describe('toCvSummary', () => {
  it('counts open questions whose target still exists', () => {
    const summary = toCvSummary(
      storedCv({
        status: 'ready',
        content: {
          contact: { fullName: '', headline: '', email: '', phone: '', location: '', links: [] },
          summary: '',
          experience: [],
          education: [],
          skills: [],
        },
        questions: [
          { id: 'a', prompt: '', target: { section: 'summary' }, status: 'open' },
          { id: 'b', prompt: '', target: { section: 'skills' }, status: 'skipped' },
          {
            id: 'c',
            prompt: '',
            target: { section: 'education', entryId: 'gone', field: 'end' },
            status: 'open',
          },
        ],
      }),
    );

    expect(summary).toEqual({
      id: 'cv-1',
      title: 'Backend CV',
      targetRole: 'Backend Engineer',
      status: 'ready',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      openQuestions: 1,
    });
  });
});
