import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface PageHeaderProps {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
}

export function PageHeader({ title, meta, actions, backTo, backLabel }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl tracking-tight break-words sm:text-4xl">{title}</h1>
          {meta && <div className="text-sm text-muted-foreground">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
