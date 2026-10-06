import { plainToInstance, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { CV_LIMITS } from '../cvs/cv-limits.js';
import { SECTIONS } from '../cvs/cv-types.js';
import type { SectionId } from '../cvs/cv-types.js';

export class DraftLink {
  @IsString() label: string;
  @IsString() url: string;
}

export class DraftContact {
  @IsString() fullName: string;
  @IsString() headline: string;
  @IsString() email: string;
  @IsString() phone: string;
  @IsString() location: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DraftLink)
  links: DraftLink[];
}

export class DraftExperience {
  @IsString() role: string;
  @IsString() company: string;
  @IsString() location: string;
  @IsString() start: string;
  @IsString() end: string;

  @IsArray()
  @IsString({ each: true })
  bullets: string[];
}

export class DraftEducation {
  @IsString() degree: string;
  @IsString() school: string;
  @IsString() start: string;
  @IsString() end: string;
  @IsString() details: string;
}

export class DraftTarget {
  @IsIn(SECTIONS) section: SectionId;
  @IsOptional() @IsInt() entryIndex: number | null;
  @IsOptional() @IsInt() bulletIndex: number | null;
  @IsOptional() @IsString() field: string | null;
}

export class DraftQuestion {
  @IsString() prompt: string;
  @IsString() hint: string;

  @IsObject()
  @ValidateNested()
  @Type(() => DraftTarget)
  target: DraftTarget;
}

export class CvDraft {
  @IsObject()
  @ValidateNested()
  @Type(() => DraftContact)
  contact: DraftContact;

  @IsString() summary: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DraftExperience)
  experience: DraftExperience[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DraftEducation)
  education: DraftEducation[];

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DraftQuestion)
  questions: DraftQuestion[];
}

export class InvalidDraftError extends Error {
  constructor(detail: string) {
    super(`The AI returned an invalid CV draft: ${detail}`);
    this.name = 'InvalidDraftError';
  }
}

const cap = (value: string, max: number) => value.trim().slice(0, max);

export function parseDraft(json: unknown): CvDraft {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new InvalidDraftError('not an object');
  }
  const draft = plainToInstance(CvDraft, json);
  const errors = validateSync(draft, { whitelist: true });
  if (errors.length > 0) {
    throw new InvalidDraftError(errors.map((error) => error.property).join(', '));
  }
  return capDraft(draft);
}

function capDraft(draft: CvDraft): CvDraft {
  const { contact, experience, education, skills, questions } = CV_LIMITS;
  return Object.assign(new CvDraft(), {
    contact: {
      fullName: cap(draft.contact.fullName, contact.fullName),
      headline: cap(draft.contact.headline, contact.headline),
      email: cap(draft.contact.email, contact.email),
      phone: cap(draft.contact.phone, contact.phone),
      location: cap(draft.contact.location, contact.location),
      links: draft.contact.links.slice(0, contact.links).map((link) => ({
        label: cap(link.label, contact.linkLabel),
        url: cap(link.url, contact.linkUrl),
      })),
    },
    summary: cap(draft.summary, CV_LIMITS.summary),
    experience: draft.experience.slice(0, experience.entries).map((entry) => ({
      role: cap(entry.role, experience.role),
      company: cap(entry.company, experience.company),
      location: cap(entry.location, experience.location),
      start: cap(entry.start, experience.date),
      end: cap(entry.end, experience.date),
      bullets: entry.bullets
        .slice(0, experience.bullets)
        .map((bullet) => cap(bullet, experience.bullet)),
    })),
    education: draft.education.slice(0, education.entries).map((entry) => ({
      degree: cap(entry.degree, education.degree),
      school: cap(entry.school, education.school),
      start: cap(entry.start, education.date),
      end: cap(entry.end, education.date),
      details: cap(entry.details, education.details),
    })),
    skills: draft.skills.slice(0, skills.entries).map((skill) => cap(skill, skills.name)),
    questions: draft.questions.map((question) => ({
      prompt: cap(question.prompt, questions.prompt),
      hint: cap(question.hint, questions.hint),
      target: question.target,
    })),
  });
}
