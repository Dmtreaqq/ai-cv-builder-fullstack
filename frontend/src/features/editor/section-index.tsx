import type { MouseEvent } from 'react';
import type { SectionId } from '@/features/cvs/cv-types';
import { visibleQuestions } from '@/features/cvs/field-ref';
import { cn } from '@/lib/utils';
import { EDITOR_SECTIONS, sectionElementId } from './editor-sections';
import { useActiveSection } from './use-active-section';
import { useEditor } from './use-editor';

export function SectionIndex() {
  const { content, questions } = useEditor();
  const [active, setActive] = useActiveSection();
  const openCounts = new Map<SectionId, number>();
  for (const question of visibleQuestions(content, questions)) {
    if (question.status === 'open') {
      const section = question.target.section;
      openCounts.set(section, (openCounts.get(section) ?? 0) + 1);
    }
  }

  function jumpTo(event: MouseEvent<HTMLAnchorElement>, id: SectionId) {
    event.preventDefault();
    setActive(id);
    document
      .getElementById(sectionElementId(id))
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav aria-label="CV sections" className="min-w-0 lg:sticky lg:top-6">
      <p className="mb-3 hidden text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase lg:block">
        Jump to
      </p>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
        {EDITOR_SECTIONS.map(({ id, label }) => {
          const count = openCounts.get(id) ?? 0;
          const isActive = active === id;
          return (
            <li key={id} className="shrink-0">
              <a
                href={`#${sectionElementId(id)}`}
                onClick={(event) => jumpTo(event, id)}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm whitespace-nowrap transition-colors hover:text-foreground',
                  'lg:rounded-none lg:bg-transparent lg:px-0 lg:py-1.5 lg:text-muted-foreground',
                  isActive &&
                    'lg:text-foreground lg:underline lg:decoration-brand lg:decoration-2 lg:underline-offset-[6px]',
                )}
              >
                {label}
                {count > 0 && (
                  <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-none font-semibold text-primary-foreground no-underline">
                    {count}
                    <span className="sr-only"> open {count === 1 ? 'question' : 'questions'}</span>
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
