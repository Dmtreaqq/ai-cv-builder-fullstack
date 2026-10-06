import { delay, http, HttpResponse } from 'msw';
import type { User } from '@/features/auth/auth-context';
import type {
  AnswerResult,
  Cv,
  CvContent,
  CvSummary,
  QuestionStatus,
} from '@/features/cvs/cv-types';
import { countOpenQuestions, targetExists } from '@/features/cvs/field-ref';
import { validateComposer } from '@/features/cvs/validate-composer';
import { createId } from '@/lib/create-id';
import { requireUser } from '../auth';
import { findCv, listCvs, removeCv, saveCv, type StoredCv } from '../db';
import { applyAnswer } from '../fixtures/questions';
import { resolveGeneration } from '../generation';

const ANSWER_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 1_000;
const MAX_TITLE_LENGTH = 120;

type CvParams = { id: string };
type QuestionParams = { id: string; qid: string };

function error(status: number, message: string) {
  return HttpResponse.json({ message }, { status });
}

const unauthorized = () => error(401, 'Log in to continue.');
const cvNotFound = () => error(404, 'CV not found.');

function toCv(stored: StoredCv): Cv {
  const {
    sourceText: _sourceText,
    sourceFileName: _sourceFileName,
    retried: _retried,
    ...cv
  } = stored;
  return cv;
}

function toSummary(cv: StoredCv): CvSummary {
  return {
    id: cv.id,
    title: cv.title,
    targetRole: cv.targetRole,
    status: cv.status,
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
    openQuestions: countOpenQuestions(cv.content, cv.questions),
  };
}

function loadCv(id: string, user: User) {
  const stored = findCv(id, user.id);
  if (!stored) {
    return null;
  }
  const resolved = resolveGeneration(stored);
  if (resolved.status !== stored.status) {
    saveCv(resolved);
  }
  return resolved;
}

function touch(cv: StoredCv, changes: Partial<StoredCv>): StoredCv {
  return saveCv({ ...cv, ...changes, updatedAt: new Date().toISOString() });
}

function setQuestionStatus(status: QuestionStatus) {
  return ({ request, params }: { request: Request; params: QuestionParams }) => {
    const user = requireUser(request);
    if (!user) {
      return unauthorized();
    }
    const cv = loadCv(params.id, user);
    if (!cv) {
      return cvNotFound();
    }
    if (!cv.questions.some((question) => question.id === params.qid)) {
      return error(404, 'Question not found.');
    }
    const questions = cv.questions.map((question) =>
      question.id === params.qid ? { ...question, status } : question,
    );
    return HttpResponse.json(toCv(touch(cv, { questions })));
  };
}

export const cvHandlers = [
  http.get('/api/cvs', ({ request }) => {
    const user = requireUser(request);
    if (!user) {
      return unauthorized();
    }
    const summaries = listCvs(user.id)
      .map((cv) => toSummary(loadCv(cv.id, user)!))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json(summaries);
  }),

  http.post('/api/cvs', async ({ request }) => {
    const user = requireUser(request);
    if (!user) {
      return unauthorized();
    }
    const form = await request.formData();
    const targetRole = String(form.get('targetRole') ?? '').trim();
    const sourceText = String(form.get('sourceText') ?? '').trim();
    const upload = form.get('file');
    const file = upload instanceof File && upload.size > 0 ? upload : null;
    const errors = validateComposer({ targetRole, sourceText, file });
    const firstError = errors.targetRole ?? errors.source ?? errors.file;
    if (firstError) {
      return error(400, firstError);
    }

    const now = new Date().toISOString();
    const cv = saveCv({
      id: createId(),
      ownerId: user.id,
      title: `${targetRole} CV`,
      targetRole,
      status: 'generating',
      createdAt: now,
      updatedAt: now,
      generationStartedAt: now,
      content: null,
      questions: [],
      sourceText,
      sourceFileName: file?.name ?? null,
      retried: false,
    });
    return HttpResponse.json(toCv(resolveGeneration(cv)), { status: 201 });
  }),

  http.get<CvParams>('/api/cvs/:id', ({ request, params }) => {
    const user = requireUser(request);
    if (!user) {
      return unauthorized();
    }
    const cv = loadCv(params.id, user);
    return cv ? HttpResponse.json(toCv(cv)) : cvNotFound();
  }),

  http.patch<CvParams>('/api/cvs/:id', async ({ request, params }) => {
    const user = requireUser(request);
    if (!user) {
      return unauthorized();
    }
    const cv = loadCv(params.id, user);
    if (!cv) {
      return cvNotFound();
    }
    const body = (await request.json()) as { title?: string; content?: CvContent };
    const changes: Partial<StoredCv> = {};
    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title || title.length > MAX_TITLE_LENGTH) {
        return error(400, `Enter a title of up to ${MAX_TITLE_LENGTH} characters.`);
      }
      changes.title = title;
    }
    if (body.content !== undefined) {
      if (cv.status !== 'ready') {
        return error(409, 'This CV can’t be edited until it’s ready.');
      }
      changes.content = body.content;
    }
    return HttpResponse.json(toCv(touch(cv, changes)));
  }),

  http.delete<CvParams>('/api/cvs/:id', ({ request, params }) => {
    const user = requireUser(request);
    if (!user) {
      return unauthorized();
    }
    if (!findCv(params.id, user.id)) {
      return cvNotFound();
    }
    removeCv(params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post<CvParams>('/api/cvs/:id/retry', ({ request, params }) => {
    const user = requireUser(request);
    if (!user) {
      return unauthorized();
    }
    const cv = loadCv(params.id, user);
    if (!cv) {
      return cvNotFound();
    }
    if (cv.status !== 'failed') {
      return error(409, 'Only a failed CV can be retried.');
    }
    const restarted = touch(cv, {
      status: 'generating',
      error: undefined,
      generationStartedAt: new Date().toISOString(),
      retried: true,
    });
    return HttpResponse.json(toCv(resolveGeneration(restarted)));
  }),

  http.post<QuestionParams>('/api/cvs/:id/questions/:qid/answer', async ({ request, params }) => {
    const user = requireUser(request);
    if (!user) {
      return unauthorized();
    }
    const { answer } = (await request.json()) as { answer?: string };
    if (!answer?.trim()) {
      return error(400, 'Enter an answer, or skip the question.');
    }
    await delay(ANSWER_DELAY_MS);

    const cv = loadCv(params.id, user);
    if (!cv?.content) {
      return cvNotFound();
    }
    const question = cv.questions.find((item) => item.id === params.qid);
    if (!question) {
      return error(404, 'Question not found.');
    }
    if (!targetExists(cv.content, question.target)) {
      return error(409, 'That part of the CV no longer exists.');
    }
    const updated = touch(cv, {
      content: applyAnswer(cv.content, question, answer),
      questions: cv.questions.map((item) =>
        item.id === question.id ? { ...item, status: 'answered', answer: answer.trim() } : item,
      ),
    });
    const result: AnswerResult = { cv: toCv(updated), changed: question.target };
    return HttpResponse.json(result);
  }),

  http.post<QuestionParams>('/api/cvs/:id/questions/:qid/skip', setQuestionStatus('skipped')),
  http.post<QuestionParams>('/api/cvs/:id/questions/:qid/reopen', setQuestionStatus('open')),
];
