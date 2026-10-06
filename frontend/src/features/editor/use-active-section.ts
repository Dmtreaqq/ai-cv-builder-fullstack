import { useEffect, useState } from 'react';
import type { SectionId } from '@/features/cvs/cv-types';
import { EDITOR_SECTIONS, sectionElementId } from './editor-sections';

export function useActiveSection() {
  const [active, setActive] = useState<SectionId>(EDITOR_SECTIONS[0].id);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        const first = EDITOR_SECTIONS.find(({ id }) => visible.has(sectionElementId(id)));
        if (first) {
          setActive(first.id);
        }
      },
      { rootMargin: '-15% 0px -55% 0px' },
    );
    for (const { id } of EDITOR_SECTIONS) {
      const element = document.getElementById(sectionElementId(id));
      if (element) {
        observer.observe(element);
      }
    }
    return () => observer.disconnect();
  }, []);

  return [active, setActive] as const;
}
