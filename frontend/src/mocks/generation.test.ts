import { seedCv } from '@/test/seed';
import { FAILURE_MS, GENERATION_MS, resolveGeneration, stageAt } from './generation';

describe('stageAt', () => {
  it.each([
    [0, 'reading'],
    [1_999, 'reading'],
    [2_000, 'analyzing'],
    [4_500, 'drafting'],
    [7_500, 'tailoring'],
    [11_999, 'reviewing'],
  ])('maps %i ms to %s', (elapsed, stage) => {
    expect(stageAt(elapsed)).toBe(stage);
  });
});

describe('resolveGeneration', () => {
  const startedAt = Date.parse('2026-01-01T10:00:00Z');
  const generating = (overrides = {}) =>
    seedCv('owner', {
      generationStartedAt: new Date(startedAt).toISOString(),
      ...overrides,
    });

  it('reports the current stage while the job is running', () => {
    const cv = resolveGeneration(generating(), startedAt + 5_000);
    expect(cv.status).toBe('generating');
    expect(cv.generation).toEqual({
      stage: 'drafting',
      stages: ['reading', 'analyzing', 'drafting', 'tailoring', 'reviewing'],
    });
    expect(cv.content).toBeNull();
  });

  it('materializes content and questions once the job is done', () => {
    const cv = resolveGeneration(generating(), startedAt + GENERATION_MS);
    expect(cv.status).toBe('ready');
    expect(cv.content?.contact.headline).toBe('Senior Backend Engineer');
    expect(cv.questions.map((question) => question.id)).toEqual([
      'q-phone',
      'q-previous-job-end',
      'q-api-metric',
      'q-graduation-year',
      'q-databases',
    ]);
  });

  it('fails a source mentioning "fail" partway through', () => {
    const cv = generating({ sourceText: 'Please fail this one' });
    expect(resolveGeneration(cv, startedAt + FAILURE_MS - 1).status).toBe('generating');
    const failed = resolveGeneration(cv, startedAt + FAILURE_MS);
    expect(failed.status).toBe('failed');
    expect(failed.error).toMatch(/couldn’t read enough/);
  });

  it('succeeds on retry even when the source mentions "fail"', () => {
    const cv = generating({ sourceText: 'Please fail this one', retried: true });
    expect(resolveGeneration(cv, startedAt + GENERATION_MS).status).toBe('ready');
  });
});
