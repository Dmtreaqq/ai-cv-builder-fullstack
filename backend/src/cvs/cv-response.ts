import type { Cv } from './cv.entity.js';
import { STAGES } from './cv-types.js';
import type { CvContent, CvStatus, FieldRef, Question, StageId } from './cv-types.js';
import { countOpenQuestions } from './field-ref.js';

export type CvResponse = {
  id: string;
  ownerId: string;
  title: string;
  targetRole: string;
  status: CvStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
  generationStartedAt: string;
  generation?: { stage: StageId; stages: StageId[] };
  content: CvContent | null;
  questions: Question[];
};

export type CvSummary = {
  id: string;
  title: string;
  targetRole: string;
  status: CvStatus;
  createdAt: string;
  updatedAt: string;
  openQuestions: number;
};

export type AnswerResult = {
  cv: CvResponse;
  changed: FieldRef;
};

export function toCvResponse(cv: Cv): CvResponse {
  return {
    id: cv.id,
    ownerId: cv.userId,
    title: cv.title,
    targetRole: cv.targetRole,
    status: cv.status,
    ...(cv.status === 'failed' && cv.error ? { error: cv.error } : {}),
    createdAt: cv.createdAt.toISOString(),
    updatedAt: cv.updatedAt.toISOString(),
    generationStartedAt: cv.generationStartedAt.toISOString(),
    ...(cv.status === 'generating'
      ? { generation: { stage: cv.stage ?? STAGES[0], stages: [...STAGES] } }
      : {}),
    content: cv.content,
    questions: cv.questions,
  };
}

export function toCvSummary(cv: Cv): CvSummary {
  return {
    id: cv.id,
    title: cv.title,
    targetRole: cv.targetRole,
    status: cv.status,
    createdAt: cv.createdAt.toISOString(),
    updatedAt: cv.updatedAt.toISOString(),
    openQuestions: countOpenQuestions(cv.content, cv.questions),
  };
}
