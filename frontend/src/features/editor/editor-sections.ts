import type { SectionId } from '@/features/cvs/cv-types';

export function sectionElementId(id: SectionId) {
  return `section-${id}`;
}
