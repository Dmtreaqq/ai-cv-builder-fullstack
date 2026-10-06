import { Check } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import type { Cv, StageId } from './cv-types';
import { GenerationSheetSkeleton } from './generation-sheet-skeleton';
import { STAGE_LABELS } from './stage-labels';

const DEFAULT_STAGES = Object.keys(STAGE_LABELS) as StageId[];

export function GenerationProgress({ cv }: { cv: Cv }) {
  const stages = cv.generation?.stages ?? DEFAULT_STAGES;
  const currentStage = cv.generation?.stage ?? stages[0];
  const currentIndex = stages.indexOf(currentStage);

  return (
    <section className="flex flex-col gap-10 py-10 sm:py-14">
      <PageHeader
        backTo="/cvs"
        backLabel="All CVs"
        title={
          <>
            Tailoring your CV for <em className="italic">{cv.targetRole}</em>
          </>
        }
        meta="You can leave or reload this page. We’ll keep working."
      />
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <ol aria-label="Progress" className="flex flex-col gap-6">
          {stages.map((stage, index) => {
            const done = index < currentIndex;
            const current = index === currentIndex;
            return (
              <li
                key={stage}
                aria-current={current ? 'step' : undefined}
                className="flex items-center gap-4"
              >
                <span
                  className={cn(
                    'w-8 font-serif text-4xl leading-none font-light text-brand tabular-nums',
                    !done && !current && 'text-brand/40',
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn('text-lg', !done && !current && 'text-muted-foreground')}>
                  {STAGE_LABELS[stage]}
                </span>
                {done && <Check className="size-4 text-brand" aria-hidden="true" />}
                {current && (
                  <span className="relative flex size-2" aria-hidden="true">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-brand" />
                  </span>
                )}
                <span className="sr-only">{done ? '(done)' : current ? '(in progress)' : ''}</span>
              </li>
            );
          })}
        </ol>
        <p className="sr-only" aria-live="polite">
          {STAGE_LABELS[currentStage]}
        </p>
        <GenerationSheetSkeleton />
      </div>
    </section>
  );
}
