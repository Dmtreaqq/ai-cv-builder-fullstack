import type { SectionId } from '@/features/cvs/cv-types';

export const EDITOR_SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'contact', label: 'Contact' },
  { id: 'summary', label: 'Summary' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
];

export function sectionElementId(id: SectionId) {
  return `section-${id}`;
}
