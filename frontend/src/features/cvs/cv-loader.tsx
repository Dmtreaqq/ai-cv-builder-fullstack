import { Link } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorPage } from '@/features/editor/editor-page';
import { GenerationFailed } from './generation-failed';
import { GenerationProgress } from './generation-progress';
import { useCv } from './use-cv';

export function CvLoader({ id }: { id: string }) {
  const { state, retry, reload } = useCv(id);

  switch (state.status) {
    case 'loading':
      return (
        <section className="flex flex-col gap-6 py-10 sm:py-14" aria-label="Loading CV">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-2/3 max-w-md" />
          <Skeleton className="h-96 rounded-2xl" />
        </section>
      );
    case 'not-found':
      return (
        <section className="flex flex-col gap-6 py-10 sm:py-14">
          <PageHeader backTo="/cvs" backLabel="All CVs" title="CV not found" />
          <p className="text-muted-foreground">
            It may have been deleted, or it belongs to another account.{' '}
            <Link to="/cvs" className="text-brand underline underline-offset-4 hover:no-underline">
              See your CVs
            </Link>
          </p>
        </section>
      );
    case 'error':
      return (
        <section className="flex flex-col items-start gap-4 py-10 sm:py-14">
          <p role="alert" className="text-muted-foreground">
            {state.message}
          </p>
          <Button variant="outline" onClick={reload}>
            Try again
          </Button>
        </section>
      );
    case 'loaded':
      break;
  }

  const { cv } = state;
  if (cv.status === 'generating') {
    return <GenerationProgress cv={cv} />;
  }
  if (cv.status === 'failed') {
    return <GenerationFailed cv={cv} onRetry={retry} />;
  }
  return <EditorPage cv={cv} />;
}
