import { apiRequest } from '@/lib/api-client';
import type { AnswerResult, Cv, CvContent, CvSummary } from './cv-types';

export interface NewCvInput {
  targetRole: string;
  sourceText: string;
  file: File | null;
}

export function listCvs(signal?: AbortSignal) {
  return apiRequest<CvSummary[]>('/cvs', { signal });
}

export function createCv({ targetRole, sourceText, file }: NewCvInput) {
  const body = new FormData();
  body.set('targetRole', targetRole);
  if (sourceText) {
    body.set('sourceText', sourceText);
  }
  if (file) {
    body.set('file', file);
  }
  return apiRequest<Cv>('/cvs', { method: 'POST', body });
}

export function getCv(id: string, signal?: AbortSignal) {
  return apiRequest<Cv>(`/cvs/${encodeURIComponent(id)}`, { signal });
}

export function updateCv(id: string, changes: { title?: string; content?: CvContent }) {
  return apiRequest<Cv>(`/cvs/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });
}

export function deleteCv(id: string) {
  return apiRequest<void>(`/cvs/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function retryCv(id: string) {
  return apiRequest<Cv>(`/cvs/${encodeURIComponent(id)}/retry`, { method: 'POST' });
}

function questionPath(cvId: string, questionId: string, action: string) {
  return `/cvs/${encodeURIComponent(cvId)}/questions/${encodeURIComponent(questionId)}/${action}`;
}

export function answerQuestion(cvId: string, questionId: string, answer: string) {
  return apiRequest<AnswerResult>(questionPath(cvId, questionId, 'answer'), {
    method: 'POST',
    body: { answer },
  });
}

export function skipQuestion(cvId: string, questionId: string) {
  return apiRequest<Cv>(questionPath(cvId, questionId, 'skip'), { method: 'POST' });
}

export function reopenQuestion(cvId: string, questionId: string) {
  return apiRequest<Cv>(questionPath(cvId, questionId, 'reopen'), { method: 'POST' });
}
