import type { CvContent, FieldRef, Question } from './cv-types.js';

export function targetExists(content: CvContent, ref: FieldRef): boolean {
  return ref.section === 'skills' || readText(content, ref) !== undefined;
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

export function countOpenQuestions(content: CvContent | null, questions: Question[]): number {
  if (!content) {
    return 0;
  }
  return questions.filter(
    (question) => question.status === 'open' && targetExists(content, question.target),
  ).length;
}
