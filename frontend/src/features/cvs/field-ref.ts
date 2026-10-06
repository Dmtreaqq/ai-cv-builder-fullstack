import type { CvContent, FieldRef, Question } from './cv-types';

export function fieldKey(ref: FieldRef) {
  switch (ref.section) {
    case 'contact':
      return `contact.${ref.field}`;
    case 'summary':
    case 'skills':
      return ref.section;
    case 'experience':
      return 'bulletId' in ref
        ? `experience.${ref.entryId}.bullets.${ref.bulletId}`
        : `experience.${ref.entryId}.${ref.field}`;
    case 'education':
      return `education.${ref.entryId}.${ref.field}`;
  }
}

export function targetExists(content: CvContent, ref: FieldRef) {
  return readText(content, ref) !== undefined || ref.section === 'skills';
}

export function readText(content: CvContent, ref: FieldRef): string | undefined {
  switch (ref.section) {
    case 'contact':
      return content.contact[ref.field];
    case 'summary':
      return content.summary;
    case 'skills':
      return undefined;
    case 'experience': {
      const entry = content.experience.find((item) => item.id === ref.entryId);
      if ('bulletId' in ref) {
        return entry?.bullets.find((bullet) => bullet.id === ref.bulletId)?.text;
      }
      return entry?.[ref.field];
    }
    case 'education':
      return content.education.find((item) => item.id === ref.entryId)?.[ref.field];
  }
}

export function writeText(content: CvContent, ref: FieldRef, value: string): CvContent {
  switch (ref.section) {
    case 'contact':
      return { ...content, contact: { ...content.contact, [ref.field]: value } };
    case 'summary':
      return { ...content, summary: value };
    case 'skills':
      return content;
    case 'experience':
      return {
        ...content,
        experience: content.experience.map((entry) => {
          if (entry.id !== ref.entryId) {
            return entry;
          }
          if ('bulletId' in ref) {
            return {
              ...entry,
              bullets: entry.bullets.map((bullet) =>
                bullet.id === ref.bulletId ? { ...bullet, text: value } : bullet,
              ),
            };
          }
          return { ...entry, [ref.field]: value };
        }),
      };
    case 'education':
      return {
        ...content,
        education: content.education.map((entry) =>
          entry.id === ref.entryId ? { ...entry, [ref.field]: value } : entry,
        ),
      };
  }
}

export function copyField(from: CvContent, to: CvContent, ref: FieldRef): CvContent {
  if (ref.section === 'skills') {
    return { ...to, skills: from.skills };
  }
  const value = readText(from, ref);
  return value === undefined ? to : writeText(to, ref, value);
}

export function visibleQuestions(content: CvContent, questions: Question[]) {
  return questions.filter((question) => targetExists(content, question.target));
}

export function countOpenQuestions(content: CvContent | null, questions: Question[]) {
  if (!content) {
    return 0;
  }
  return visibleQuestions(content, questions).filter((question) => question.status === 'open')
    .length;
}
