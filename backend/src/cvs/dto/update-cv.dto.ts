import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CV_LIMITS } from '../cv-limits.js';
import { CvContentDto } from './cv-content.dto.js';

const TITLE_MESSAGE = `Enter a title of up to ${CV_LIMITS.title} characters.`;

export class UpdateCvDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: TITLE_MESSAGE })
  @IsNotEmpty({ message: TITLE_MESSAGE })
  @MaxLength(CV_LIMITS.title, { message: TITLE_MESSAGE })
  title?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CvContentDto)
  content?: CvContentDto;
}
