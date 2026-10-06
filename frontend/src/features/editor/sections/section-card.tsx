import type { ReactNode } from 'react';
import type { SectionId } from '@/features/cvs/cv-types';
import { cn } from '@/lib/utils';
import { sectionElementId } from '../editor-sections';

interface SectionCardProps {
  id: SectionId;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export function SectionCard({ id, title, description, className, children }: SectionCardProps) {
  const headingId = `${sectionElementId(id)}-heading`;

  return (
    <section
      id={sectionElementId(id)}
      aria-labelledby={headingId}
      className={cn(
        'flex scroll-mt-20 flex-col gap-5 rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border sm:p-6 lg:scroll-mt-6',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-2xl tracking-tight">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
