import type {
  CvContent,
  EducationEntry,
  ExperienceEntry,
  FieldRef,
  Question,
} from '@/features/cvs/cv-types';
import { copyField, fieldKey, writeText } from '@/features/cvs/field-ref';

export interface EditorState {
  content: CvContent;
  questions: Question[];
  highlight: string | null;
}

type EntrySection = 'experience' | 'education';
type Offset = -1 | 1;

export type EditorAction =
  | { type: 'setText'; ref: FieldRef; value: string }
  | { type: 'addEntry'; section: EntrySection; id: string }
  | { type: 'removeEntry'; section: EntrySection; entryId: string }
  | { type: 'moveEntry'; section: EntrySection; entryId: string; offset: Offset }
  | { type: 'addBullet'; entryId: string; id: string }
  | { type: 'removeBullet'; entryId: string; bulletId: string }
  | { type: 'moveBullet'; entryId: string; bulletId: string; offset: Offset }
  | { type: 'addLink'; id: string }
  | { type: 'setLink'; linkId: string; field: 'label' | 'url'; value: string }
  | { type: 'removeLink'; linkId: string }
  | { type: 'addSkill'; id: string; name: string }
  | { type: 'removeSkill'; skillId: string }
  | { type: 'applyChange'; content: CvContent; changed: FieldRef; questions: Question[] }
  | { type: 'setQuestions'; questions: Question[] }
  | { type: 'clearHighlight' };

export function moveItem<T extends { id: string }>(items: T[], id: string, offset: Offset): T[] {
  const index = items.findIndex((item) => item.id === id);
  const target = index + offset;
  if (index === -1 || target < 0 || target >= items.length) {
    return items;
  }
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function emptyExperience(id: string): ExperienceEntry {
  return { id, role: '', company: '', location: '', start: '', end: '', bullets: [] };
}

function emptyEducation(id: string): EducationEntry {
  return { id, degree: '', school: '', start: '', end: '', details: '' };
}

function updateExperience(
  content: CvContent,
  entryId: string,
  update: (entry: ExperienceEntry) => ExperienceEntry,
): CvContent {
  return {
    ...content,
    experience: content.experience.map((entry) => (entry.id === entryId ? update(entry) : entry)),
  };
}

function contentReducer(content: CvContent, action: EditorAction): CvContent {
  switch (action.type) {
    case 'setText':
      return writeText(content, action.ref, action.value);
    case 'addEntry':
      return action.section === 'experience'
        ? { ...content, experience: [...content.experience, emptyExperience(action.id)] }
        : { ...content, education: [...content.education, emptyEducation(action.id)] };
    case 'removeEntry':
      return action.section === 'experience'
        ? { ...content, experience: content.experience.filter(({ id }) => id !== action.entryId) }
        : { ...content, education: content.education.filter(({ id }) => id !== action.entryId) };
    case 'moveEntry':
      return action.section === 'experience'
        ? { ...content, experience: moveItem(content.experience, action.entryId, action.offset) }
        : { ...content, education: moveItem(content.education, action.entryId, action.offset) };
    case 'addBullet':
      return updateExperience(content, action.entryId, (entry) => ({
        ...entry,
        bullets: [...entry.bullets, { id: action.id, text: '' }],
      }));
    case 'removeBullet':
      return updateExperience(content, action.entryId, (entry) => ({
        ...entry,
        bullets: entry.bullets.filter(({ id }) => id !== action.bulletId),
      }));
    case 'moveBullet':
      return updateExperience(content, action.entryId, (entry) => ({
        ...entry,
        bullets: moveItem(entry.bullets, action.bulletId, action.offset),
      }));
    case 'addLink':
      return {
        ...content,
        contact: {
          ...content.contact,
          links: [...content.contact.links, { id: action.id, label: '', url: '' }],
        },
      };
    case 'setLink':
      return {
        ...content,
        contact: {
          ...content.contact,
          links: content.contact.links.map((link) =>
            link.id === action.linkId ? { ...link, [action.field]: action.value } : link,
          ),
        },
      };
    case 'removeLink':
      return {
        ...content,
        contact: {
          ...content.contact,
          links: content.contact.links.filter(({ id }) => id !== action.linkId),
        },
      };
    case 'addSkill':
      return { ...content, skills: [...content.skills, { id: action.id, name: action.name }] };
    case 'removeSkill':
      return { ...content, skills: content.skills.filter(({ id }) => id !== action.skillId) };
    default:
      return content;
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'applyChange':
      return {
        content: copyField(action.content, state.content, action.changed),
        questions: action.questions,
        highlight: fieldKey(action.changed),
      };
    case 'setQuestions':
      return { ...state, questions: action.questions };
    case 'clearHighlight':
      return { ...state, highlight: null };
    default: {
      const content = contentReducer(state.content, action);
      return content === state.content ? state : { ...state, content };
    }
  }
}
