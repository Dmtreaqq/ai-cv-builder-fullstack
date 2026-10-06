import { randomUUID } from 'node:crypto';
import { CV_LIMITS } from '../cvs/cv-limits.js';
import { CONTACT_FIELDS, EDUCATION_FIELDS, EXPERIENCE_FIELDS } from '../cvs/cv-types.js';
import type { CvContent, FieldRef, Question } from '../cvs/cv-types.js';
import type { CvDraft, DraftTarget } from './cv-draft.js';

export type MappedDraft = {
  content: CvContent;
  questions: Question[];
};

const includes = <T extends string>(list: readonly T[], value: string | null): value is T =>
  value !== null && (list as readonly string[]).includes(value);

export function toCvContent(draft: CvDraft): MappedDraft {
  const content: CvContent = {
    contact: {
      fullName: draft.contact.fullName,
      headline: draft.contact.headline,
      email: draft.contact.email,
      phone: draft.contact.phone,
      location: draft.contact.location,
      links: draft.contact.links
        .filter((link) => link.url)
        .map((link) => ({ id: randomUUID(), label: link.label, url: link.url })),
    },
    summary: draft.summary,
    experience: draft.experience.map((entry) => ({
      id: randomUUID(),
      role: entry.role,
      company: entry.company,
      location: entry.location,
      start: entry.start,
      end: entry.end,
      bullets: entry.bullets.map((text) => ({ id: randomUUID(), text })),
    })),
    education: draft.education.map((entry) => ({
      id: randomUUID(),
      degree: entry.degree,
      school: entry.school,
      start: entry.start,
      end: entry.end,
      details: entry.details,
    })),
    skills: uniqueSkills(draft.skills).map((name) => ({ id: randomUUID(), name })),
  };

  const questions: Question[] = [];
  for (const question of draft.questions) {
    const target = toFieldRef(content, question.target);
    if (!target || !question.prompt) {
      continue;
    }
    questions.push({
      id: randomUUID(),
      prompt: question.prompt,
      ...(question.hint ? { hint: question.hint } : {}),
      target,
      status: 'open',
    });
    if (questions.length === CV_LIMITS.questions.entries) {
      break;
    }
  }

  return { content, questions };
}

export function uniqueSkills(names: string[]): string[] {
  const seen = new Set<string>();
  return names
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLowerCase();
      if (!name || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

// Draft questions point at entries by index; the CV refers to them by the ids assigned above.
function toFieldRef(content: CvContent, target: DraftTarget): FieldRef | null {
  switch (target.section) {
    case 'summary':
    case 'skills':
      return { section: target.section };
    case 'contact':
      return includes(CONTACT_FIELDS, target.field)
        ? { section: 'contact', field: target.field }
        : null;
    case 'experience': {
      const entry = content.experience[target.entryIndex ?? -1];
      if (!entry) {
        return null;
      }
      if (target.bulletIndex !== null && target.bulletIndex !== undefined) {
        const bullet = entry.bullets[target.bulletIndex];
        return bullet ? { section: 'experience', entryId: entry.id, bulletId: bullet.id } : null;
      }
      return includes(EXPERIENCE_FIELDS, target.field)
        ? { section: 'experience', entryId: entry.id, field: target.field }
        : null;
    }
    case 'education': {
      const entry = content.education[target.entryIndex ?? -1];
      return entry && includes(EDUCATION_FIELDS, target.field)
        ? { section: 'education', entryId: entry.id, field: target.field }
        : null;
    }
  }
}
