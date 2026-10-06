import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getQueueToken } from '@nestjs/bullmq';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiNotConfiguredError, AiOutputError } from '../ai/ai-errors.js';
import { AnswerApplierService } from '../ai/answer-applier.service.js';
import type { AppliedAnswer } from '../ai/answer-applier.service.js';
import type { AnswerInput } from '../ai/answer-prompt.js';
import { Cv } from './cv.entity.js';
import type { CvContent, Question } from './cv-types.js';
import { CvsService } from './cvs.service.js';
import { CV_GENERATION_QUEUE } from './generation/cv-generation.queue.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const CV_ID = '22222222-2222-4222-8222-222222222222';
const PDF = { buffer: Buffer.from('%PDF-1.7 body'), size: 13, originalname: 'cv.pdf' };

function content(): CvContent {
  return {
    contact: { fullName: 'Jordan', headline: '', email: '', phone: '', location: '', links: [] },
    summary: 'Engineer.',
    experience: [
      {
        id: 'exp-acme',
        role: 'Engineer',
        company: 'Acme',
        location: '',
        start: '2021',
        end: '',
        bullets: [{ id: 'bullet-perf', text: 'Improved API performance.' }],
      },
    ],
    education: [],
    skills: [{ id: 's1', name: 'Go' }],
  };
}

function questions(): Question[] {
  return [
    {
      id: 'q-phone',
      prompt: 'Phone?',
      target: { section: 'contact', field: 'phone' },
      status: 'open',
    },
    {
      id: 'q-perf',
      prompt: 'How much faster?',
      target: { section: 'experience', entryId: 'exp-acme', bulletId: 'bullet-perf' },
      status: 'open',
    },
    { id: 'q-db', prompt: 'Databases?', target: { section: 'skills' }, status: 'open' },
  ];
}

function storedCv(overrides: Partial<Cv> = {}): Cv {
  return Object.assign(new Cv(), {
    id: CV_ID,
    userId: USER_ID,
    title: 'Backend Engineer CV',
    targetRole: 'Backend Engineer',
    status: 'ready',
    stage: null,
    error: null,
    sourceText: null,
    sourceFileName: null,
    content: content(),
    questions: questions(),
    generationStartedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
}

describe('CvsService', () => {
  const repository = {
    find: jest.fn<(options: unknown) => Promise<Cv[]>>(),
    findOneBy: jest.fn<(where: Partial<Cv>) => Promise<Cv | null>>(),
    create: jest.fn((data: Partial<Cv>) => Object.assign(new Cv(), data)),
    save: jest.fn(async (cv: Cv) => Object.assign(cv, { id: cv.id ?? CV_ID })),
    delete: jest.fn<(where: unknown) => Promise<unknown>>(),
  };
  const queue = {
    add: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    remove: jest.fn<(id: string) => Promise<number>>(),
  };
  const answers = { apply: jest.fn<(input: AnswerInput) => Promise<AppliedAnswer>>() };
  let service: CvsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    queue.add.mockResolvedValue({});
    queue.remove.mockResolvedValue(1);
    const moduleRef = await Test.createTestingModule({
      providers: [
        CvsService,
        { provide: getRepositoryToken(Cv), useValue: repository },
        { provide: getQueueToken(CV_GENERATION_QUEUE), useValue: queue },
        { provide: AnswerApplierService, useValue: answers },
      ],
    }).compile();
    service = moduleRef.get(CvsService);
  });

  describe('ownership', () => {
    it('scopes lookups by owner and hides other users’ CVs as 404', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(USER_ID, CV_ID)).rejects.toThrow(
        new NotFoundException('CV not found.'),
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: CV_ID, userId: USER_ID });
    });

    it('returns 404 for an id that is not a UUID without querying', async () => {
      await expect(service.findOne(USER_ID, 'nope')).rejects.toThrow(NotFoundException);
      expect(repository.findOneBy).not.toHaveBeenCalled();
    });

    it('lists only the owner’s CVs, newest first', async () => {
      repository.find.mockResolvedValue([]);

      await service.list(USER_ID);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('saves a generating CV and enqueues one job per CV', async () => {
      const cv = await service.create(USER_ID, {
        targetRole: 'Backend Engineer',
        sourceText: 'Hi',
      });

      expect(cv).toMatchObject({
        userId: USER_ID,
        title: 'Backend Engineer CV',
        status: 'generating',
        stage: 'reading',
        sourceText: 'Hi',
        content: null,
        questions: [],
      });
      expect(queue.add).toHaveBeenCalledWith(
        'generate',
        { cvId: CV_ID },
        expect.objectContaining({ jobId: CV_ID, attempts: 3, removeOnFail: true }),
      );
    });

    it('stores an uploaded PDF and its name', async () => {
      const cv = await service.create(USER_ID, { targetRole: 'Designer' }, PDF);

      expect(cv.sourcePdf).toBe(PDF.buffer);
      expect(cv.sourceFileName).toBe('cv.pdf');
    });

    it('requires text or a PDF', async () => {
      await expect(service.create(USER_ID, { targetRole: 'Designer' })).rejects.toThrow(
        new BadRequestException('Describe your background or attach your current CV as a PDF.'),
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects a file that is not a PDF', async () => {
      const notPdf = { ...PDF, buffer: Buffer.from('hello'), size: 5 };

      await expect(service.create(USER_ID, { targetRole: 'Designer' }, notPdf)).rejects.toThrow(
        new BadRequestException('Attach a PDF file.'),
      );
    });

    it('marks the CV failed when the job cannot be queued, so Retry works', async () => {
      queue.add.mockRejectedValue(new Error('redis down'));

      const cv = await service.create(USER_ID, { targetRole: 'Dev', sourceText: 'Hi' });

      expect(cv.status).toBe('failed');
      expect(cv.error).toMatch(/Try again/);
      expect(cv.sourceText).toBe('Hi');
    });
  });

  describe('update', () => {
    it('renames a CV at any status', async () => {
      repository.findOneBy.mockResolvedValue(storedCv({ status: 'generating', content: null }));

      const cv = await service.update(USER_ID, CV_ID, { title: 'Mine' });

      expect(cv.title).toBe('Mine');
    });

    it('returns 409 when content is sent before the CV is ready', async () => {
      repository.findOneBy.mockResolvedValue(storedCv({ status: 'generating', content: null }));

      await expect(service.update(USER_ID, CV_ID, { content: content() })).rejects.toThrow(
        ConflictException,
      );
    });

    it('replaces the content of a ready CV', async () => {
      repository.findOneBy.mockResolvedValue(storedCv());
      const next = { ...content(), summary: 'New.' };

      const cv = await service.update(USER_ID, CV_ID, { content: next });

      expect(cv.content?.summary).toBe('New.');
    });
  });

  describe('remove', () => {
    it('deletes the CV and its pending job', async () => {
      repository.findOneBy.mockResolvedValue(storedCv());

      await service.remove(USER_ID, CV_ID);

      expect(repository.delete).toHaveBeenCalledWith({ id: CV_ID, userId: USER_ID });
      expect(queue.remove).toHaveBeenCalledWith(CV_ID);
    });

    it('still succeeds when the job can’t be removed', async () => {
      repository.findOneBy.mockResolvedValue(storedCv());
      queue.remove.mockRejectedValue(new Error('locked'));

      await expect(service.remove(USER_ID, CV_ID)).resolves.toBeUndefined();
    });
  });

  describe('retry', () => {
    it('returns 409 unless the CV failed', async () => {
      repository.findOneBy.mockResolvedValue(storedCv({ status: 'ready' }));

      await expect(service.retry(USER_ID, CV_ID)).rejects.toThrow(
        new ConflictException('Only a failed CV can be retried.'),
      );
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('resets a failed CV to generating and enqueues it again', async () => {
      repository.findOneBy.mockResolvedValue(
        storedCv({ status: 'failed', error: 'Boom', content: null, questions: [] }),
      );

      const cv = await service.retry(USER_ID, CV_ID);

      expect(cv).toMatchObject({ status: 'generating', stage: 'reading', error: null });
      expect(queue.add).toHaveBeenCalledWith(
        'generate',
        { cvId: CV_ID },
        expect.objectContaining({ jobId: CV_ID }),
      );
    });
  });

  describe('answerQuestion', () => {
    it('writes the field, marks the question answered and reports what changed', async () => {
      repository.findOneBy.mockImplementation(async () => storedCv());
      answers.apply.mockResolvedValue({ kind: 'text', value: '+49 151 2345 6789' });

      const { cv, changed } = await service.answerQuestion(USER_ID, CV_ID, 'q-phone', '+49 151');

      expect(cv.content?.contact.phone).toBe('+49 151 2345 6789');
      expect(cv.questions[0]).toMatchObject({ status: 'answered', answer: '+49 151' });
      expect(cv.questions[1].status).toBe('open');
      expect(changed).toEqual({ section: 'contact', field: 'phone' });
      expect(answers.apply).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'Phone?',
          answer: '+49 151',
          targetRole: 'Backend Engineer',
        }),
      );
    });

    it('applies the result to the latest saved content', async () => {
      repository.findOneBy
        .mockResolvedValueOnce(storedCv())
        .mockResolvedValueOnce(storedCv({ content: { ...content(), summary: 'Autosaved.' } }));
      answers.apply.mockResolvedValue({ kind: 'text', value: 'Cut p95 by 80%.' });

      const { cv } = await service.answerQuestion(USER_ID, CV_ID, 'q-perf', '80%');

      expect(cv.content?.summary).toBe('Autosaved.');
      expect(cv.content?.experience[0].bullets[0].text).toBe('Cut p95 by 80%.');
    });

    it('merges new skills without duplicates', async () => {
      repository.findOneBy.mockImplementation(async () => storedCv());
      answers.apply.mockResolvedValue({ kind: 'skills', skills: ['go', 'PostgreSQL', 'Redis'] });

      const { cv } = await service.answerQuestion(USER_ID, CV_ID, 'q-db', 'postgres, redis');

      expect(cv.content?.skills.map((skill) => skill.name)).toEqual(['Go', 'PostgreSQL', 'Redis']);
    });

    it('returns 404 for an unknown question', async () => {
      repository.findOneBy.mockResolvedValue(storedCv());

      await expect(service.answerQuestion(USER_ID, CV_ID, 'nope', 'x')).rejects.toThrow(
        new NotFoundException('Question not found.'),
      );
    });

    it('returns 409 when the targeted part of the CV is gone', async () => {
      repository.findOneBy.mockResolvedValue(
        storedCv({ content: { ...content(), experience: [] } }),
      );

      await expect(service.answerQuestion(USER_ID, CV_ID, 'q-perf', 'x')).rejects.toThrow(
        new ConflictException('That part of the CV no longer exists.'),
      );
      expect(answers.apply).not.toHaveBeenCalled();
    });

    it('returns 409 when the target is removed while the AI is working', async () => {
      repository.findOneBy
        .mockResolvedValueOnce(storedCv())
        .mockResolvedValueOnce(storedCv({ content: { ...content(), experience: [] } }));
      answers.apply.mockResolvedValue({ kind: 'text', value: 'x' });

      await expect(service.answerQuestion(USER_ID, CV_ID, 'q-perf', 'x')).rejects.toThrow(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('returns 503 when the AI is not configured or unavailable', async () => {
      repository.findOneBy.mockResolvedValue(storedCv());
      answers.apply.mockRejectedValue(new AiNotConfiguredError());

      await expect(service.answerQuestion(USER_ID, CV_ID, 'q-phone', 'x')).rejects.toThrow(
        new ServiceUnavailableException('AI generation is not configured.'),
      );
    });

    it('returns 502 when the AI output can’t be used', async () => {
      repository.findOneBy.mockResolvedValue(storedCv());
      answers.apply.mockRejectedValue(new AiOutputError('refusal'));

      await expect(service.answerQuestion(USER_ID, CV_ID, 'q-phone', 'x')).rejects.toThrow(
        BadGatewayException,
      );
    });
  });

  describe('setQuestionStatus', () => {
    it('skips and reopens a question', async () => {
      repository.findOneBy.mockImplementation(async () => storedCv());

      const skipped = await service.setQuestionStatus(USER_ID, CV_ID, 'q-db', 'skipped');
      expect(skipped.questions[2].status).toBe('skipped');

      repository.findOneBy.mockResolvedValue(skipped);
      const reopened = await service.setQuestionStatus(USER_ID, CV_ID, 'q-db', 'open');
      expect(reopened.questions[2].status).toBe('open');
    });

    it('returns 404 for an unknown question', async () => {
      repository.findOneBy.mockResolvedValue(storedCv());

      await expect(service.setQuestionStatus(USER_ID, CV_ID, 'nope', 'skipped')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
