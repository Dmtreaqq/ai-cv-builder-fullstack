import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RateLimit } from '../throttling/rate-limit.decorator.js';
import { toCvResponse, toCvSummary } from './cv-response.js';
import type { AnswerResult, CvResponse, CvSummary } from './cv-response.js';
import { CvsService } from './cvs.service.js';
import { AnswerQuestionDto } from './dto/answer-question.dto.js';
import { CreateCvDto } from './dto/create-cv.dto.js';
import { UpdateCvDto } from './dto/update-cv.dto.js';
import { PDF_UPLOAD_LIMITS } from './pdf-file.js';
import type { UploadedPdf } from './pdf-file.js';
import { PdfUploadFilter } from './pdf-upload.filter.js';

@Controller('cvs')
export class CvsController {
  constructor(private readonly cvs: CvsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<CvSummary[]> {
    return (await this.cvs.list(user.id)).map(toCvSummary);
  }

  @Post()
  @RateLimit('generation')
  @UseInterceptors(FileInterceptor('file', { limits: PDF_UPLOAD_LIMITS }))
  @UseFilters(PdfUploadFilter)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCvDto,
    @UploadedFile() file?: UploadedPdf,
  ): Promise<CvResponse> {
    return toCvResponse(await this.cvs.create(user.id, dto, file));
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<CvResponse> {
    return toCvResponse(await this.cvs.findOne(user.id, id));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCvDto,
  ): Promise<CvResponse> {
    return toCvResponse(await this.cvs.update(user.id, id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.cvs.remove(user.id, id);
  }

  @Post(':id/retry')
  @RateLimit('generation')
  @HttpCode(HttpStatus.OK)
  async retry(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<CvResponse> {
    return toCvResponse(await this.cvs.retry(user.id, id));
  }

  @Post(':id/questions/:qid/answer')
  @RateLimit('answer')
  @HttpCode(HttpStatus.OK)
  async answer(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('qid') questionId: string,
    @Body() dto: AnswerQuestionDto,
  ): Promise<AnswerResult> {
    const { cv, changed } = await this.cvs.answerQuestion(user.id, id, questionId, dto.answer);
    return { cv: toCvResponse(cv), changed };
  }

  @Post(':id/questions/:qid/skip')
  @HttpCode(HttpStatus.OK)
  async skip(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('qid') questionId: string,
  ): Promise<CvResponse> {
    return toCvResponse(await this.cvs.setQuestionStatus(user.id, id, questionId, 'skipped'));
  }

  @Post(':id/questions/:qid/reopen')
  @HttpCode(HttpStatus.OK)
  async reopen(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('qid') questionId: string,
  ): Promise<CvResponse> {
    return toCvResponse(await this.cvs.setQuestionStatus(user.id, id, questionId, 'open'));
  }
}
