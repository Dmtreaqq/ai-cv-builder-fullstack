import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import Anthropic from '@anthropic-ai/sdk';
import { UnrecoverableError } from 'bullmq';
import type { Job } from 'bullmq';
import type { Repository } from 'typeorm';
import { AiNotConfiguredError, AiOutputError } from '../../ai/ai-errors.js';
import type { CvDraft } from '../../ai/cv-draft.js';
import type { CvGeneratorService, StageListener } from '../../ai/cv-generator.service.js';
import type { GenerationInput } from '../../ai/cv-generation-prompt.js';
import { Cv } from '../cv.entity.js';
import type { CvGenerationJob } from './cv-generation.queue.js';
import { CvGenerationProcessor, isFinalFailure } from './cv-generation.processor.js';

const CV_ID = '22222222-2222-4222-8222-222222222222';

const DRAFT: CvDraft = {
  contact: { fullName: 'Jordan', headline: '', email: '', phone: '', location: '', links: [] },
  summary: 'Engineer.',
  experience: [],
  education: [],
  skills: ['Go'],
  questions: [
    {
      prompt: 'Phone?',
      hint: '',
      target: { section: 'contact', entryIndex: null, bulletIndex: null, field: 'phone' },
    },
  ],
};

function storedCv(overrides: Partial<Cv> = {}): Cv {
  return Object.assign(new Cv(), {
    id: CV_ID,
    targetRole: 'Backend Engineer',
    status: 'generating',
    sourceText: 'Eight years.',
    sourcePdf: Buffer.from('%PDF-1.7'),
    ...overrides,
  });
}

function job(attemptsMade = 0): Job<CvGenerationJob> {
  return { data: { cvId: CV_ID }, attemptsMade, opts: { attempts: 3 } } as Job<CvGenerationJob>;
}

describe('CvGenerationProcessor', () => {
  const queryBuilder = {
    addSelect: jest.fn(() => queryBuilder),
    where: jest.fn(() => queryBuilder),
    getOne: jest.fn<() => Promise<Cv | null>>(),
  };
  const repository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    update: jest.fn<(where: unknown, changes: Partial<Cv>) => Promise<unknown>>(),
  };
  const generator = {
    generate: jest.fn<(input: GenerationInput, onStage: StageListener) => Promise<CvDraft>>(),
  };
  const processor = new CvGenerationProcessor(
    repository as unknown as Repository<Cv>,
    generator as unknown as CvGeneratorService,
  );

  const updates = () => repository.update.mock.calls.map(([, changes]) => changes);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.update.mockResolvedValue({});
    queryBuilder.getOne.mockResolvedValue(storedCv());
  });

  it('loads the PDF, records stages and finishes with content and questions', async () => {
    generator.generate.mockImplementation(async (_input, onStage) => {
      onStage('analyzing');
      onStage('drafting');
      return DRAFT;
    });

    await processor.process(job());

    expect(queryBuilder.addSelect).toHaveBeenCalledWith('cv.sourcePdf');
    expect(generator.generate.mock.calls[0][0]).toEqual({
      targetRole: 'Backend Engineer',
      sourceText: 'Eight years.',
      sourcePdf: Buffer.from('%PDF-1.7'),
    });
    expect(updates().slice(0, 3)).toEqual([
      { stage: 'reading' },
      { stage: 'analyzing' },
      { stage: 'drafting' },
    ]);
    expect(repository.update).toHaveBeenLastCalledWith(
      { id: CV_ID, status: 'generating' },
      expect.objectContaining({ status: 'ready', stage: null, error: null }),
    );
  });

  it('clears every source field on success', async () => {
    generator.generate.mockResolvedValue(DRAFT);

    await processor.process(job());

    const finished = updates().at(-1);
    expect(finished).toMatchObject({ sourceText: null, sourcePdf: null, sourceFileName: null });
    expect(finished?.content?.contact.fullName).toBe('Jordan');
    expect(finished?.questions).toEqual([
      expect.objectContaining({ prompt: 'Phone?', status: 'open' }),
    ]);
  });

  it('does nothing when the CV was deleted or is no longer generating', async () => {
    queryBuilder.getOne.mockResolvedValueOnce(null);
    await processor.process(job());

    queryBuilder.getOne.mockResolvedValueOnce(storedCv({ status: 'ready' }));
    await processor.process(job());

    expect(generator.generate).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rethrows transient errors so BullMQ retries them', async () => {
    const error = new Anthropic.APIConnectionError({ message: 'reset' });
    generator.generate.mockRejectedValue(error);

    await expect(processor.process(job())).rejects.toBe(error);
  });

  it('turns permanent errors into UnrecoverableError with a safe message', async () => {
    generator.generate.mockRejectedValue(new AiOutputError('secret detail'));

    const failure = processor.process(job());

    await expect(failure).rejects.toThrow(UnrecoverableError);
    await expect(failure).rejects.toThrow(/couldn’t write a CV/);
  });

  it('reports a missing key as not configured', async () => {
    generator.generate.mockRejectedValue(new AiNotConfiguredError());

    await expect(processor.process(job())).rejects.toThrow('AI generation is not configured.');
  });

  describe('onFailed', () => {
    it('marks the CV failed with the safe message on the final failure', async () => {
      await processor.onFailed(job(1), new UnrecoverableError('AI generation is not configured.'));

      expect(repository.update).toHaveBeenCalledWith(
        { id: CV_ID, status: 'generating' },
        { status: 'failed', stage: null, error: 'AI generation is not configured.' },
      );
    });

    it('uses a generic message once transient retries run out', async () => {
      await processor.onFailed(job(3), new Error('upstream said something secret'));

      const [, changes] = repository.update.mock.calls[0];
      expect(changes.error).not.toContain('secret');
      expect(changes.status).toBe('failed');
    });

    it('waits while attempts remain', async () => {
      await processor.onFailed(job(1), new Anthropic.APIConnectionError({ message: 'reset' }));

      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});

describe('isFinalFailure', () => {
  it('is final for unrecoverable errors or exhausted attempts', () => {
    expect(isFinalFailure(job(1), new UnrecoverableError('x'))).toBe(true);
    expect(isFinalFailure(job(3), new Error('x'))).toBe(true);
    expect(isFinalFailure(job(2), new Error('x'))).toBe(false);
  });
});
