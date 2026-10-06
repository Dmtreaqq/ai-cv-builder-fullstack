import { describe, expect, it } from '@jest/globals';
import { CV_LIMITS } from '../cvs/cv-limits.js';
import { InvalidDraftError, parseDraft } from './cv-draft.js';

function validDraft(overrides: Record<string, unknown> = {}) {
  return {
    contact: { fullName: 'A', headline: '', email: '', phone: '', location: '', links: [] },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    questions: [
      {
        prompt: 'Phone?',
        hint: '',
        target: { section: 'contact', entryIndex: null, bulletIndex: null, field: 'phone' },
      },
    ],
    ...overrides,
  };
}

describe('parseDraft', () => {
  it('accepts a draft that matches the schema', () => {
    const draft = parseDraft(validDraft());

    expect(draft.contact.fullName).toBe('A');
    expect(draft.questions[0].target.field).toBe('phone');
  });

  it('rejects non-objects and wrong types', () => {
    expect(() => parseDraft(null)).toThrow(InvalidDraftError);
    expect(() => parseDraft([])).toThrow(InvalidDraftError);
    expect(() => parseDraft(validDraft({ skills: [1] }))).toThrow(InvalidDraftError);
    expect(() => parseDraft(validDraft({ contact: undefined }))).toThrow(InvalidDraftError);
    expect(() =>
      parseDraft(
        validDraft({
          questions: [{ prompt: 'x', hint: '', target: { section: 'hobbies' } }],
        }),
      ),
    ).toThrow(InvalidDraftError);
  });

  it('caps lengths and counts to what the editor accepts', () => {
    const draft = parseDraft(
      validDraft({
        summary: 'x'.repeat(CV_LIMITS.summary + 50),
        skills: Array.from({ length: CV_LIMITS.skills.entries + 5 }, (_, i) => `Skill ${i}`),
        experience: [
          {
            role: '  Engineer  ',
            company: 'Acme',
            location: '',
            start: '',
            end: '',
            bullets: Array.from({ length: 25 }, () => 'b'.repeat(CV_LIMITS.experience.bullet + 1)),
          },
        ],
      }),
    );

    expect(draft.summary).toHaveLength(CV_LIMITS.summary);
    expect(draft.skills).toHaveLength(CV_LIMITS.skills.entries);
    expect(draft.experience[0].role).toBe('Engineer');
    expect(draft.experience[0].bullets).toHaveLength(CV_LIMITS.experience.bullets);
    expect(draft.experience[0].bullets[0]).toHaveLength(CV_LIMITS.experience.bullet);
  });
});
