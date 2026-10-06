import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CV_LIMITS } from '../cv-limits.js';

const { contact, experience, education, skills } = CV_LIMITS;

class ItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(CV_LIMITS.id)
  id: string;
}

export class ContactLinkDto extends ItemDto {
  @IsString()
  @MaxLength(contact.linkLabel)
  label: string;

  @IsString()
  @MaxLength(contact.linkUrl)
  url: string;
}

export class ContactDto {
  @IsString()
  @MaxLength(contact.fullName)
  fullName: string;

  @IsString()
  @MaxLength(contact.headline)
  headline: string;

  @IsString()
  @MaxLength(contact.email)
  email: string;

  @IsString()
  @MaxLength(contact.phone)
  phone: string;

  @IsString()
  @MaxLength(contact.location)
  location: string;

  @IsArray()
  @ArrayMaxSize(contact.links)
  @ValidateNested({ each: true })
  @Type(() => ContactLinkDto)
  links: ContactLinkDto[];
}

export class BulletDto extends ItemDto {
  @IsString()
  @MaxLength(experience.bullet)
  text: string;
}

export class ExperienceEntryDto extends ItemDto {
  @IsString()
  @MaxLength(experience.role)
  role: string;

  @IsString()
  @MaxLength(experience.company)
  company: string;

  @IsString()
  @MaxLength(experience.location)
  location: string;

  @IsString()
  @MaxLength(experience.date)
  start: string;

  @IsString()
  @MaxLength(experience.date)
  end: string;

  @IsArray()
  @ArrayMaxSize(experience.bullets)
  @ValidateNested({ each: true })
  @Type(() => BulletDto)
  bullets: BulletDto[];
}

export class EducationEntryDto extends ItemDto {
  @IsString()
  @MaxLength(education.degree)
  degree: string;

  @IsString()
  @MaxLength(education.school)
  school: string;

  @IsString()
  @MaxLength(education.date)
  start: string;

  @IsString()
  @MaxLength(education.date)
  end: string;

  @IsString()
  @MaxLength(education.details)
  details: string;
}

export class SkillDto extends ItemDto {
  @IsString()
  @MaxLength(skills.name)
  name: string;
}

export class CvContentDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @IsString()
  @MaxLength(CV_LIMITS.summary)
  summary: string;

  @IsArray()
  @ArrayMaxSize(experience.entries)
  @ValidateNested({ each: true })
  @Type(() => ExperienceEntryDto)
  experience: ExperienceEntryDto[];

  @IsArray()
  @ArrayMaxSize(education.entries)
  @ValidateNested({ each: true })
  @Type(() => EducationEntryDto)
  education: EducationEntryDto[];

  @IsArray()
  @ArrayMaxSize(skills.entries)
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills: SkillDto[];
}
