import type { Generation, StageId } from '@/features/cvs/cv-types';
import type { StoredCv } from './db';
import { buildCvContent } from './fixtures/persona';
import { buildQuestions } from './fixtures/questions';

export const STAGES: { id: StageId; startsAt: number }[] = [
  { id: 'reading', startsAt: 0 },
  { id: 'analyzing', startsAt: 2_000 },
  { id: 'drafting', startsAt: 4_500 },
  { id: 'tailoring', startsAt: 7_500 },
  { id: 'reviewing', startsAt: 10_000 },
];

export const GENERATION_MS = 12_000;
export const FAILURE_MS = 6_000;
export const FAILURE_MESSAGE =
  'We couldn’t read enough from your background to write a CV. Try again, or add more detail.';

export function stageAt(elapsedMs: number): StageId {
  let current = STAGES[0].id;
  for (const stage of STAGES) {
    if (elapsedMs >= stage.startsAt) {
      current = stage.id;
    }
  }
  return current;
}

export function shouldFail(cv: StoredCv) {
  return !cv.retried && /fail/i.test(cv.sourceText);
}

function generationFor(elapsedMs: number): Generation {
  return { stage: stageAt(elapsedMs), stages: STAGES.map((stage) => stage.id) };
}

// The job is derived from elapsed time, so it "keeps running" across reloads without a timer.
export function resolveGeneration(cv: StoredCv, now = Date.now()): StoredCv {
  if (cv.status !== 'generating') {
    return cv;
  }
  const elapsed = now - Date.parse(cv.generationStartedAt);
  const finishedAt = new Date(now).toISOString();

  if (shouldFail(cv) && elapsed >= FAILURE_MS) {
    return { ...cv, status: 'failed', error: FAILURE_MESSAGE, updatedAt: finishedAt };
  }
  if (elapsed >= GENERATION_MS) {
    const content = buildCvContent(cv.targetRole);
    return {
      ...cv,
      status: 'ready',
      content,
      questions: buildQuestions(content),
      updatedAt: finishedAt,
    };
  }
  return { ...cv, generation: generationFor(elapsed) };
}
