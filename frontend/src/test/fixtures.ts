import type { User } from '@/features/auth/auth-context';
import type { Cv, CvContent, CvSummary, Question, StageId } from '@/features/cvs/cv-types';

export const STAGES: StageId[] = ['reading', 'analyzing', 'drafting', 'tailoring', 'reviewing'];

export function makeUser(overrides: Partial<User> = {}): User {
  return { id: 'user-1', email: 'jordan@example.com', ...overrides };
}

export function makeContent(): CvContent {
  return {
    contact: {
      fullName: 'Jordan Lee',
      headline: 'Senior Backend Engineer',
      email: 'jordan.lee@example.com',
      phone: '',
      location: 'Berlin, Germany',
      links: [
        { id: 'link-linkedin', label: 'LinkedIn', url: 'linkedin.com/in/jordanlee' },
        { id: 'link-github', label: 'GitHub', url: 'github.com/jordanlee' },
      ],
    },
    summary:
      'Product-minded engineer with eight years of experience shipping reliable services and the tooling around them.',
    experience: [
      {
        id: 'exp-acme',
        role: 'Senior Software Engineer',
        company: 'Acme Analytics',
        location: 'Berlin',
        start: 'Mar 2021',
        end: 'Present',
        bullets: [
          {
            id: 'bullet-acme-pipeline',
            text: 'Led the migration of the reporting pipeline to an event-driven architecture.',
          },
          { id: 'bullet-acme-performance', text: 'Improved API performance.' },
          {
            id: 'bullet-acme-mentoring',
            text: 'Mentored four engineers and introduced a lightweight design review process.',
          },
        ],
      },
      {
        id: 'exp-northwind',
        role: 'Software Engineer',
        company: 'Northwind Logistics',
        location: 'Hamburg',
        start: 'Jun 2018',
        end: '',
        bullets: [
          {
            id: 'bullet-northwind-tracking',
            text: 'Built the shipment tracking service that processes two million events a day.',
          },
        ],
      },
      {
        id: 'exp-brightpath',
        role: 'Junior Developer',
        company: 'Brightpath Studio',
        location: 'Remote',
        start: 'Sep 2016',
        end: 'May 2018',
        bullets: [
          {
            id: 'bullet-brightpath-apps',
            text: 'Shipped client web apps in React and Node.js.',
          },
        ],
      },
    ],
    education: [
      {
        id: 'edu-tum',
        degree: 'BSc Computer Science',
        school: 'Technical University of Munich',
        start: '2012',
        end: '',
        details: 'Thesis on cache invalidation strategies in distributed systems.',
      },
    ],
    skills: ['TypeScript', 'Node.js', 'Go', 'Kafka'].map((name) => ({
      id: `skill-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
    })),
  };
}

export function makeQuestions(): Question[] {
  return [
    {
      id: 'q-phone',
      prompt: 'What phone number should recruiters use?',
      hint: 'Include the country code, e.g. +49 151 2345 6789',
      target: { section: 'contact', field: 'phone' },
      status: 'open',
    },
    {
      id: 'q-previous-job-end',
      prompt: 'When did you leave Northwind Logistics?',
      hint: 'e.g. Aug 2022',
      target: { section: 'experience', entryId: 'exp-northwind', field: 'end' },
      status: 'open',
    },
    {
      id: 'q-api-metric',
      prompt: 'How much did API performance improve, and on which metric?',
      target: { section: 'experience', entryId: 'exp-acme', bulletId: 'bullet-acme-performance' },
      status: 'open',
    },
    {
      id: 'q-graduation-year',
      prompt: 'What year did you graduate?',
      target: { section: 'education', entryId: 'edu-tum', field: 'end' },
      status: 'open',
    },
    {
      id: 'q-databases',
      prompt: 'Which databases have you used in production?',
      target: { section: 'skills' },
      status: 'open',
    },
  ];
}

export function makeCv(overrides: Partial<Cv> = {}): Cv {
  const now = '2026-10-01T10:00:00.000Z';
  return {
    id: 'cv-1',
    ownerId: 'user-1',
    title: 'Senior Backend Engineer CV',
    targetRole: 'Senior Backend Engineer',
    status: 'ready',
    createdAt: now,
    updatedAt: now,
    generationStartedAt: now,
    content: makeContent(),
    questions: makeQuestions(),
    ...overrides,
  };
}

export function makeGeneratingCv(stage: StageId = 'reading'): Cv {
  return makeCv({
    status: 'generating',
    generation: { stage, stages: STAGES },
    content: null,
    questions: [],
  });
}

export function toSummary(cv: Cv, openQuestions = 0): CvSummary {
  return {
    id: cv.id,
    title: cv.title,
    targetRole: cv.targetRole,
    status: cv.status,
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
    openQuestions,
  };
}
