import type { CvContent } from '@/features/cvs/cv-types';

export const PERSONA_IDS = {
  currentJob: 'exp-acme',
  vagueBullet: 'bullet-acme-performance',
  previousJob: 'exp-northwind',
  degree: 'edu-tum',
};

function withArticle(role: string) {
  return `${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}`;
}

export function buildCvContent(targetRole: string): CvContent {
  return {
    contact: {
      fullName: 'Jordan Lee',
      headline: targetRole,
      email: 'jordan.lee@example.com',
      phone: '',
      location: 'Berlin, Germany',
      links: [
        { id: 'link-linkedin', label: 'LinkedIn', url: 'linkedin.com/in/jordanlee' },
        { id: 'link-github', label: 'GitHub', url: 'github.com/jordanlee' },
      ],
    },
    summary: `Product-minded engineer with eight years of experience shipping reliable services and the tooling around them. I turn ambiguous problems into small, well-tested increments and leave systems easier to change than I found them. Looking for my next step as ${withArticle(targetRole)}.`,
    experience: [
      {
        id: PERSONA_IDS.currentJob,
        role: 'Senior Software Engineer',
        company: 'Acme Analytics',
        location: 'Berlin',
        start: 'Mar 2021',
        end: 'Present',
        bullets: [
          {
            id: 'bullet-acme-pipeline',
            text: 'Led the migration of the reporting pipeline to an event-driven architecture serving 40+ enterprise customers.',
          },
          { id: PERSONA_IDS.vagueBullet, text: 'Improved API performance.' },
          {
            id: 'bullet-acme-mentoring',
            text: 'Mentored four engineers and introduced a lightweight design review process.',
          },
        ],
      },
      {
        id: PERSONA_IDS.previousJob,
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
          {
            id: 'bullet-northwind-ci',
            text: 'Cut deployment time from 40 to 8 minutes by moving CI to containerized runners.',
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
            text: 'Shipped client web apps in React and Node.js for retail and education brands.',
          },
        ],
      },
    ],
    education: [
      {
        id: PERSONA_IDS.degree,
        degree: 'BSc Computer Science',
        school: 'Technical University of Munich',
        start: '2012',
        end: '',
        details: 'Thesis on cache invalidation strategies in distributed systems.',
      },
    ],
    skills: [
      'TypeScript',
      'Node.js',
      'Go',
      'React',
      'Kafka',
      'Docker',
      'Kubernetes',
      'AWS',
      'GraphQL',
      'CI/CD',
    ].map((name) => ({ id: `skill-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name })),
  };
}
