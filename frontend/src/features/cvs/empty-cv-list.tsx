import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function EmptyCvList() {
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div
        aria-hidden="true"
        className="flex aspect-[1/1.414] w-24 -rotate-3 flex-col gap-1.5 bg-card p-3 shadow-lg shadow-foreground/10 ring-1 ring-border"
      >
        <div className="h-2 w-3/4 rounded-full bg-foreground/15" />
        <div className="h-1 w-1/2 rounded-full bg-brand/50" />
        <div className="mt-2 h-1 w-full rounded-full bg-foreground/10" />
        <div className="h-1 w-5/6 rounded-full bg-foreground/10" />
        <div className="h-1 w-2/3 rounded-full bg-foreground/10" />
      </div>
      <div className="flex max-w-sm flex-col gap-2">
        <h2 className="text-2xl tracking-tight">No CVs yet</h2>
        <p className="text-muted-foreground">
          Describe your background or attach your current CV, name the role, and we’ll draft a CV
          written for it.
        </p>
      </div>
      <Button asChild size="lg">
        <Link to="/cvs/new">
          <Plus data-icon="inline-start" />
          Create your first CV
        </Link>
      </Button>
    </div>
  );
}
