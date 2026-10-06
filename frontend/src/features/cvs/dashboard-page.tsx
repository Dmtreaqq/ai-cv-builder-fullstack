import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CvCard } from './cv-card';
import { EmptyCvList } from './empty-cv-list';
import { useCvList } from './use-cv-list';

export function DashboardPage() {
  const { state, reload, rename, remove } = useCvList();

  return (
    <section className="flex flex-col gap-8 py-10 sm:py-14">
      <PageHeader
        title="Your CVs"
        actions={
          <Button asChild>
            <Link to="/cvs/new">
              <Plus data-icon="inline-start" />
              New CV
            </Link>
          </Button>
        }
      />
      {state.status === 'loading' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading your CVs">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}
      {state.status === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-muted-foreground">
            {state.message}
          </p>
          <Button variant="outline" onClick={reload}>
            Try again
          </Button>
        </div>
      )}
      {state.status === 'loaded' && state.cvs.length === 0 && <EmptyCvList />}
      {state.status === 'loaded' && state.cvs.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.cvs.map((cv) => (
            <li key={cv.id} className="flex flex-col">
              <CvCard
                cv={cv}
                onRename={(title) => rename(cv.id, title)}
                onDelete={() => remove(cv.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
