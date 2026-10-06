export const CV_STATUSES = ['generating', 'ready', 'failed'] as const;
export type CvStatus = (typeof CV_STATUSES)[number];

export const STAGES = ['reading', 'analyzing', 'drafting', 'tailoring', 'reviewing'] as const;
export type StageId = (typeof STAGES)[number];

export type ContactLink = {
  id: string;
  label: string;
  url: string;
};

export type Contact = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: ContactLink[];
};

export type Bullet = {
  id: string;
  text: string;
};

export type ExperienceEntry = {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: Bullet[];
};

export type EducationEntry = {
  id: string;
  degree: string;
  school: string;
  start: string;
  end: string;
  details: string;
};

export type Skill = {
  id: string;
  name: string;
};

export type CvContent = {
  contact: Contact;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: Skill[];
};

export const SECTIONS = ['contact', 'summary', 'experience', 'education', 'skills'] as const;
export type SectionId = (typeof SECTIONS)[number];

export const CONTACT_FIELDS = ['fullName', 'headline', 'email', 'phone', 'location'] as const;
export const EXPERIENCE_FIELDS = ['role', 'company', 'location', 'start', 'end'] as const;
export const EDUCATION_FIELDS = ['degree', 'school', 'start', 'end', 'details'] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];
export type ExperienceField = (typeof EXPERIENCE_FIELDS)[number];
export type EducationField = (typeof EDUCATION_FIELDS)[number];

export type FieldRef =
  | { section: 'contact'; field: ContactField }
  | { section: 'summary' }
  | { section: 'experience'; entryId: string; field: ExperienceField }
  | { section: 'experience'; entryId: string; bulletId: string }
  | { section: 'education'; entryId: string; field: EducationField }
  | { section: 'skills' };

export type QuestionStatus = 'open' | 'answered' | 'skipped';

export type Question = {
  id: string;
  prompt: string;
  hint?: string;
  target: FieldRef;
  status: QuestionStatus;
  answer?: string;
};
