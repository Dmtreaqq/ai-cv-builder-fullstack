import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { UnrecoverableError } from 'bullmq';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { classifyAiError, safeMessage } from '../../ai/ai-errors.js';
import { CvGeneratorService } from '../../ai/cv-generator.service.js';
import { toCvContent } from '../../ai/draft-mapper.js';
import { Cv } from '../cv.entity.js';
import type { StageId } from '../cv-types.js';
import { CV_GENERATION_QUEUE } from './cv-generation.queue.js';
import type { CvGenerationJob } from './cv-generation.queue.js';

@Processor(CV_GENERATION_QUEUE, { concurrency: 2 })
export class CvGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(CvGenerationProcessor.name);

  constructor(
    @InjectRepository(Cv) private readonly cvs: Repository<Cv>,
    private readonly generator: CvGeneratorService,
  ) {
    super();
  }

  async process(job: Job<CvGenerationJob>): Promise<void> {
    const { cvId } = job.data;
    const cv = await this.cvs
      .createQueryBuilder('cv')
      .addSelect('cv.sourcePdf')
      .where('cv.id = :cvId', { cvId })
      .getOne();
    if (!cv || cv.status !== 'generating') {
      return;
    }

    await this.setStage(cvId, 'reading');
    let mapped: ReturnType<typeof toCvContent>;
    try {
      const draft = await this.generator.generate(
        {
          targetRole: cv.targetRole,
          sourceText: cv.sourceText,
          sourcePdf: cv.sourcePdf ?? null,
        },
        (stage) => void this.setStage(cvId, stage),
      );
      mapped = toCvContent(draft);
    } catch (error) {
      const kind = classifyAiError(error);
      this.logger.warn(
        `Generation attempt ${job.attemptsMade + 1} for CV ${cvId} failed (${kind})`,
      );
      if (kind === 'transient') {
        throw error;
      }
      throw new UnrecoverableError(safeMessage(kind));
    }

    await this.cvs.update(
      { id: cvId, status: 'generating' },
      {
        status: 'ready',
        stage: null,
        error: null,
        content: mapped.content,
        questions: mapped.questions,
        sourceText: null,
        sourcePdf: null,
        sourceFileName: null,
      },
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<CvGenerationJob> | undefined, error: Error): Promise<void> {
    if (!job || !isFinalFailure(job, error)) {
      return;
    }
    // Only messages we wrote ourselves reach the user; anything else gets the generic text.
    const message =
      error instanceof UnrecoverableError ? error.message : safeMessage(classifyAiError(error));
    try {
      await this.cvs.update(
        { id: job.data.cvId, status: 'generating' },
        { status: 'failed', stage: null, error: message },
      );
    } catch (updateError) {
      this.logger.error(`Could not mark CV ${job.data.cvId} as failed: ${String(updateError)}`);
    }
  }

  private async setStage(cvId: string, stage: StageId): Promise<void> {
    try {
      await this.cvs.update({ id: cvId, status: 'generating' }, { stage });
    } catch (error) {
      this.logger.warn(`Could not record stage ${stage} for CV ${cvId}: ${String(error)}`);
    }
  }
}

export function isFinalFailure(job: Job, error: Error): boolean {
  return (
    error instanceof UnrecoverableError ||
    error.name === 'UnrecoverableError' ||
    job.attemptsMade >= (job.opts.attempts ?? 1)
  );
}
