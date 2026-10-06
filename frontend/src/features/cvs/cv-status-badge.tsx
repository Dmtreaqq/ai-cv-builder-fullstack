import { Badge } from '@/components/ui/badge';
import type { CvSummary } from './cv-types';

export function CvStatusBadge({ cv }: { cv: Pick<CvSummary, 'status' | 'openQuestions'> }) {
  if (cv.status === 'generating') {
    return (
      <Badge variant="secondary">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground/50" aria-hidden="true" />
        Generating…
      </Badge>
    );
  }
  if (cv.status === 'failed') {
    return <Badge variant="destructive">Failed</Badge>;
  }
  if (cv.openQuestions > 0) {
    return (
      <Badge variant="outline">
        <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
        Needs input · {cv.openQuestions}
      </Badge>
    );
  }
  return <Badge variant="secondary">Ready</Badge>;
}
