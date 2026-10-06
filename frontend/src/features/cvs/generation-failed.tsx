import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import type { Cv } from './cv-types';

interface GenerationFailedProps {
  cv: Cv;
  onRetry: () => Promise<void>;
}

export function GenerationFailed({ cv, onRetry }: GenerationFailedProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setPending(true);
    setError(null);
    try {
      await onRetry();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Couldn’t restart. Try again.');
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col gap-8 py-10 sm:py-14">
      <PageHeader
        backTo="/cvs"
        backLabel="All CVs"
        title="We couldn’t finish your CV"
        meta={cv.targetRole}
      />
      <div className="flex max-w-xl flex-col items-start gap-6">
        <p className="text-lg text-muted-foreground">{cv.error ?? 'Something went wrong.'}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={handleRetry} disabled={pending}>
            <RotateCcw data-icon="inline-start" />
            {pending ? 'Retrying…' : 'Retry'}
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to="/cvs">Back to CVs</Link>
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
