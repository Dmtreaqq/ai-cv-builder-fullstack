import { CONTACT_FIELDS, EDUCATION_FIELDS, EXPERIENCE_FIELDS, SECTIONS } from '../cvs/cv-types.js';

const text = (description: string) => ({ type: 'string', description });

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] });

function object(properties: Record<string, unknown>) {
  return {
    type: 'object',
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
  };
}

const TARGET_FIELDS = [...new Set([...CONTACT_FIELDS, ...EXPERIENCE_FIELDS, ...EDUCATION_FIELDS])];

// Structured outputs constrain the shape; lengths and counts are capped in parseDraft.
export const CV_DRAFT_SCHEMA = object({
  contact: object({
    fullName: text('As written in the source, or empty.'),
    headline: text('A short professional headline aimed at the target role.'),
    email: text('Only if stated in the source, else empty.'),
    phone: text('Only if stated in the source, else empty.'),
    location: text('City and country if stated, else empty.'),
    links: {
      type: 'array',
      items: object({
        label: text('e.g. LinkedIn, GitHub, Portfolio.'),
        url: text('Exactly as stated in the source.'),
      }),
    },
  }),
  summary: text('Two to four sentences tailored to the target role.'),
  experience: {
    type: 'array',
    description: 'Most relevant first.',
    items: object({
      role: text('Job title.'),
      company: text('Employer name.'),
      location: text('City or Remote, else empty.'),
      start: text('Like "Mar 2021" or "2021", else empty.'),
      end: text('Like "Aug 2023", "Present", or empty if unknown.'),
      bullets: {
        type: 'array',
        description: 'Concise, impact-first achievements, one sentence each.',
        items: { type: 'string' },
      },
    }),
  },
  education: {
    type: 'array',
    items: object({
      degree: text('Degree or qualification.'),
      school: text('Institution name.'),
      start: text('Year or month and year, else empty.'),
      end: text('Year or month and year, else empty.'),
      details: text('Thesis, honours or focus, else empty.'),
    }),
  },
  skills: {
    type: 'array',
    description: 'Short skill names, most relevant to the role first.',
    items: { type: 'string' },
  },
  questions: {
    type: 'array',
    description: 'At most 8, most impactful first. Each one fills exactly one field.',
    items: object({
      prompt: text('A short, direct question to the candidate.'),
      hint: text('An example of a good answer, or empty.'),
      target: object({
        section: { type: 'string', enum: [...SECTIONS] },
        entryIndex: nullable({
          type: 'integer',
          description: 'Index into experience or education; null otherwise.',
        }),
        bulletIndex: nullable({
          type: 'integer',
          description:
            'Index into that experience entry’s bullets, when the question improves one.',
        }),
        field: nullable({
          type: 'string',
          enum: TARGET_FIELDS,
          description: 'The field to fill for contact, experience or education; null otherwise.',
        }),
      }),
    }),
  },
});
