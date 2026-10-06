import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { CV_LIMITS } from '../cv-limits.js';

// Control characters except tab, line feed and carriage return.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

function cleanSourceText({ value }: { value: unknown }) {
  if (typeof value !== 'string') {
    return value;
  }
  const cleaned = value.replace(CONTROL_CHARACTERS, '').trim();
  return cleaned || undefined;
}

export class CreateCvDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Enter the role you’re applying for.' })
  @Length(CV_LIMITS.targetRole.min, CV_LIMITS.targetRole.max, {
    message: `Keep the role between ${CV_LIMITS.targetRole.min} and ${CV_LIMITS.targetRole.max} characters.`,
  })
  targetRole: string;

  @IsOptional()
  @Transform(cleanSourceText)
  @IsString()
  @MaxLength(CV_LIMITS.sourceText, { message: 'Keep your background under 30,000 characters.' })
  sourceText?: string;
}
