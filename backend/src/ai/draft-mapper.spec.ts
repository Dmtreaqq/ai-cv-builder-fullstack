import { describe, expect, it } from '@jest/globals';
import type { CvDraft, DraftQuestion, DraftTarget } from './cv-draft.js';
import { toCvContent, uniqueSkills } from './draft-mapper.js';

const UUID = /^[0-9a-f-]{36}$/;

function target(overrides: Partial<DraftTarget>): DraftTarget {
  return { section: 'summary', entryIndex: null, bulletIndex: null, field: null, ...overrides };
}

function question(prompt: string, overrides: Partial<DraftTarget>, hint = ''): DraftQuestion {
  return { prompt, hint, target: target(overrides) };
}

function draft(questions: DraftQuestion[] = []): CvDraft {
  return {
    contact: {
      fullName: 'Jordan Lee',
      headline: 'Backend Engineer',
      email: '',
      phone: '',
      location: 'Berlin',
      links: [
        { label: 'GitHub', url: 'github.com/jordan' },
        { label: 'Empty', url: '' },
      ],
    },
    summary: 'Engineer.',
    experience: [
      {
        role: 'Engineer',
        company: 'Acme',
        location: '',
        start: '2021',
        end: '',
        bullets: ['Improved API performance.', 'Mentored engineers.'],
      },
    ],
    education: [{ degree: 'BSc CS', school: 'TUM', start: '2012', end: '', details: '' }],
    skills: ['Go', 'go', ' TypeScript ', ''],
    questions,
  };
}

describe('toCvContent', () => {
  it('assigns ids to entries, bullets, links and skills', () => {
    const { content } = toCvContent(draft());

    expect(content.experience[0].id).toMatch(UUID);
    expect(content.experience[0].bullets.map((bullet) => bullet.id)).toEqual([
      expect.stringMatching(UUID),
      expect.stringMatching(UUID),
    ]);
    expect(content.education[0].id).toMatch(UUID);
    expect(content.contact.links).toEqual([
      { id: expect.stringMatching(UUID), label: 'GitHub', url: 'github.com/jordan' },
    ]);
    expect(content.skills.map((skill) => skill.name)).toEqual(['Go', 'TypeScript']);
  });

  it('maps question targets by index to field refs with real ids', () => {
    const { content, questions } = toCvContent(
      draft([
        question('Phone?', { section: 'contact', field: 'phone' }),
        question('Metric?', { section: 'experience', entryIndex: 0, bulletIndex: 0 }),
        question('Left Acme?', { section: 'experience', entryIndex: 0, field: 'end' }),
        question('Graduated?', { section: 'education', entryIndex: 0, field: 'end' }),
        question('Databases?', { section: 'skills' }),
        question('Summary?', { section: 'summary' }),
      ]),
    );
    const job = content.experience[0];

    expect(questions.map((item) => item.target)).toEqual([
      { section: 'contact', field: 'phone' },
      { section: 'experience', entryId: job.id, bulletId: job.bullets[0].id },
      { section: 'experience', entryId: job.id, field: 'end' },
      { section: 'education', entryId: content.education[0].id, field: 'end' },
      { section: 'skills' },
      { section: 'summary' },
    ]);
    expect(questions[0]).toEqual({
      id: expect.stringMatching(UUID),
      prompt: 'Phone?',
      target: { section: 'contact', field: 'phone' },
      status: 'open',
    });
  });

  it('drops questions whose target does not exist', () => {
    const { questions } = toCvContent(
      draft([
        question('Bad entry', { section: 'experience', entryIndex: 5, field: 'end' }),
        question('Bad bullet', { section: 'experience', entryIndex: 0, bulletIndex: 9 }),
        question('Wrong field', { section: 'contact', field: 'degree' }),
        question('No field', { section: 'education', entryIndex: 0 }),
        question('', { section: 'summary' }),
        question('Kept', { section: 'summary' }),
      ]),
    );

    expect(questions.map((item) => item.prompt)).toEqual(['Kept']);
  });

  it('keeps at most 8 questions, in order, with hints when given', () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      question(`Q${index}`, { section: 'summary' }, index === 0 ? 'e.g. this' : ''),
    );

    const { questions } = toCvContent(draft(many));

    expect(questions.map((item) => item.prompt)).toEqual([
      'Q0',
      'Q1',
      'Q2',
      'Q3',
      'Q4',
      'Q5',
      'Q6',
      'Q7',
    ]);
    expect(questions[0].hint).toBe('e.g. this');
    expect(questions[1]).not.toHaveProperty('hint');
  });
});

describe('uniqueSkills', () => {
  it('trims, drops empties and removes case-insensitive duplicates', () => {
    expect(uniqueSkills([' Go', 'GO', '', 'Rust'])).toEqual(['Go', 'Rust']);
  });
});
