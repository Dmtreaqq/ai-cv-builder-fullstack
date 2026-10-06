import { randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { classifyAiError, safeMessage } from '../ai/ai-errors.js';
import { AnswerApplierService } from '../ai/answer-applier.service.js';
import type { AppliedAnswer } from '../ai/answer-applier.service.js';
import type { AnswerInput } from '../ai/answer-prompt.js';
import { uniqueSkills } from '../ai/draft-mapper.js';
import { Cv } from './cv.entity.js';
import { CV_LIMITS } from './cv-limits.js';
import type { CvContent, FieldRef, QuestionStatus } from './cv-types.js';
import type { CreateCvDto } from './dto/create-cv.dto.js';
import type { UpdateCvDto } from './dto/update-cv.dto.js';
import { targetExists, writeText } from './field-ref.js';
import {
  CV_GENERATION_QUEUE,
  GENERATE_CV_JOB,
  generationJobOptions,
} from './generation/cv-generation.queue.js';
import type { CvGenerationJob } from './generation/cv-generation.queue.js';
import { assertPdf } from './pdf-file.js';
import type { UploadedPdf } from './pdf-file.js';

export type AnsweredCv = { cv: Cv; changed: FieldRef };

const TARGET_GONE = 'That part of the CV no longer exists.';

@Injectable()
export class CvsService {
  private readonly logger = new Logger(CvsService.name);

  constructor(
    @InjectRepository(Cv) private readonly cvs: Repository<Cv>,
    @InjectQueue(CV_GENERATION_QUEUE) private readonly queue: Queue<CvGenerationJob>,
    private readonly answers: AnswerApplierService,
  ) {}

  list(userId: string): Promise<Cv[]> {
    return this.cvs.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(userId: string, id: string): Promise<Cv> {
    const cv = isUUID(id) ? await this.cvs.findOneBy({ id, userId }) : null;
    if (!cv) {
      throw new NotFoundException('CV not found.');
    }
    return cv;
  }

  async create(userId: string, dto: CreateCvDto, file?: UploadedPdf): Promise<Cv> {
    if (file) {
      assertPdf(file);
    }
    if (!dto.sourceText && !file) {
      throw new BadRequestException('Describe your background or attach your current CV as a PDF.');
    }

    const cv = await this.cvs.save(
      this.cvs.create({
        userId,
        title: `${dto.targetRole} CV`.slice(0, CV_LIMITS.title),
        targetRole: dto.targetRole,
        status: 'generating',
        stage: 'reading',
        error: null,
        sourceText: dto.sourceText ?? null,
        sourcePdf: file?.buffer ?? null,
        sourceFileName: file?.originalname.slice(0, 255) ?? null,
        content: null,
        questions: [],
        generationStartedAt: new Date(),
      }),
    );
    return this.enqueue(cv);
  }

  async update(userId: string, id: string, dto: UpdateCvDto): Promise<Cv> {
    const cv = await this.findOne(userId, id);
    if (dto.title !== undefined) {
      cv.title = dto.title;
    }
    if (dto.content !== undefined) {
      if (cv.status !== 'ready') {
        throw new ConflictException('This CV can’t be edited until it’s ready.');
      }
      cv.content = dto.content;
    }
    return this.cvs.save(cv);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.cvs.delete({ id, userId });
    try {
      await this.queue.remove(id);
    } catch (error) {
      // An active job can't be removed; it finds the CV gone and stops.
      this.logger.warn(`Could not remove the generation job for CV ${id}: ${String(error)}`);
    }
  }

  async retry(userId: string, id: string): Promise<Cv> {
    const cv = await this.findOne(userId, id);
    if (cv.status !== 'failed') {
      throw new ConflictException('Only a failed CV can be retried.');
    }
    cv.status = 'generating';
    cv.stage = 'reading';
    cv.error = null;
    cv.generationStartedAt = new Date();
    return this.enqueue(await this.cvs.save(cv));
  }

  async answerQuestion(
    userId: string,
    id: string,
    questionId: string,
    answer: string,
  ): Promise<AnsweredCv> {
    const cv = await this.findOne(userId, id);
    const question = cv.questions.find((item) => item.id === questionId);
    if (!question) {
      throw new NotFoundException('Question not found.');
    }
    if (cv.status !== 'ready' || !cv.content) {
      throw new ConflictException('This CV isn’t ready yet.');
    }
    if (!targetExists(cv.content, question.target)) {
      throw new ConflictException(TARGET_GONE);
    }

    const applied = await this.applyAnswer({
      targetRole: cv.targetRole,
      question: question.prompt,
      answer,
      target: question.target,
      content: cv.content,
    });

    // The AI call takes a few seconds; apply the result to whatever autosave stored meanwhile.
    const fresh = await this.findOne(userId, id);
    if (!fresh.content || !targetExists(fresh.content, question.target)) {
      throw new ConflictException(TARGET_GONE);
    }
    fresh.content = applyResult(fresh.content, question.target, applied);
    fresh.questions = fresh.questions.map((item) =>
      item.id === questionId ? { ...item, status: 'answered', answer } : item,
    );
    return { cv: await this.cvs.save(fresh), changed: question.target };
  }

  async setQuestionStatus(
    userId: string,
    id: string,
    questionId: string,
    status: QuestionStatus,
  ): Promise<Cv> {
    const cv = await this.findOne(userId, id);
    if (!cv.questions.some((question) => question.id === questionId)) {
      throw new NotFoundException('Question not found.');
    }
    cv.questions = cv.questions.map((question) =>
      question.id === questionId ? { ...question, status } : question,
    );
    return this.cvs.save(cv);
  }

  private async enqueue(cv: Cv): Promise<Cv> {
    try {
      await this.queue.add(GENERATE_CV_JOB, { cvId: cv.id }, generationJobOptions(cv.id));
      return cv;
    } catch (error) {
      this.logger.error(`Could not enqueue generation for CV ${cv.id}: ${String(error)}`);
      cv.status = 'failed';
      cv.stage = null;
      cv.error = safeMessage('transient');
      return this.cvs.save(cv);
    }
  }

  private async applyAnswer(input: AnswerInput): Promise<AppliedAnswer> {
    try {
      return await this.answers.apply(input);
    } catch (error) {
      const kind = classifyAiError(error);
      this.logger.warn(`Applying an answer failed (${kind}): ${String(error)}`);
      if (kind === 'permanent') {
        throw new BadGatewayException('We couldn’t apply that answer. Try rephrasing it.');
      }
      throw new ServiceUnavailableException(safeMessage(kind));
    }
  }
}

export function applyResult(content: CvContent, target: FieldRef, applied: AppliedAnswer) {
  if (applied.kind === 'text') {
    return writeText(content, target, applied.value);
  }
  return addSkills(content, applied.skills);
}

export function addSkills(content: CvContent, names: string[]): CvContent {
  const existing = new Set(content.skills.map((skill) => skill.name.toLowerCase()));
  const added = uniqueSkills(names)
    .filter((name) => !existing.has(name.toLowerCase()))
    .map((name) => ({ id: randomUUID(), name }));
  return {
    ...content,
    skills: [...content.skills, ...added].slice(0, CV_LIMITS.skills.entries),
  };
}
