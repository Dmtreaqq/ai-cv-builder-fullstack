export type CvStatus = 'generating' | 'ready' | 'failed';

export type StageId = 'reading' | 'analyzing' | 'drafting' | 'tailoring' | 'reviewing';

export interface ContactLink {
  id: string;
  label: string;
  url: string;
}

export interface Contact {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: ContactLink[];
}

export interface Bullet {
  id: string;
  text: string;
}

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: Bullet[];
}

export interface EducationEntry {
  id: string;
  degree: string;
  school: string;
  start: string;
  end: string;
  details: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface CvContent {
  contact: Contact;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: Skill[];
}

export type SectionId = 'contact' | 'summary' | 'experience' | 'education' | 'skills';

export type ContactField = Exclude<keyof Contact, 'links'>;
export type ExperienceField = Exclude<keyof ExperienceEntry, 'id' | 'bullets'>;
export type EducationField = Exclude<keyof EducationEntry, 'id'>;

export type FieldRef =
  | { section: 'contact'; field: ContactField }
  | { section: 'summary' }
  | { section: 'experience'; entryId: string; field: ExperienceField }
  | { section: 'experience'; entryId: string; bulletId: string }
  | { section: 'education'; entryId: string; field: EducationField }
  | { section: 'skills' };

export type QuestionStatus = 'open' | 'answered' | 'skipped';

export interface Question {
  id: string;
  prompt: string;
  hint?: string;
  target: FieldRef;
  status: QuestionStatus;
  answer?: string;
}

export interface Generation {
  stage: StageId;
  stages: StageId[];
}

export interface Cv {
  id: string;
  ownerId: string;
  title: string;
  targetRole: string;
  status: CvStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
  generationStartedAt: string;
  generation?: Generation;
  content: CvContent | null;
  questions: Question[];
}

export interface CvSummary {
  id: string;
  title: string;
  targetRole: string;
  status: CvStatus;
  createdAt: string;
  updatedAt: string;
  openQuestions: number;
}

export interface AnswerResult {
  cv: Cv;
  changed: FieldRef;
}
