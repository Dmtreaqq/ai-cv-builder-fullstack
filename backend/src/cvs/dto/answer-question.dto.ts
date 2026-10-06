import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CV_LIMITS } from '../cv-limits.js';

export class AnswerQuestionDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Enter an answer, or skip the question.' })
  @MaxLength(CV_LIMITS.answer, { message: 'Keep your answer under 1,000 characters.' })
  answer: string;
}
