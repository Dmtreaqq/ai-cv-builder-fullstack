import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Document, pdfjs } from 'react-pdf';
import type { CvContent } from '@/features/cvs/cv-types';
import { PdfPages } from './pdf-pages';
import { PdfSheetSkeleton } from './pdf-sheet-skeleton';
import { useElementWidth } from './use-element-width';
import { usePdfBlob } from './use-pdf-blob';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function pageCountLabel(count: number) {
  return count === 1 ? '1 page' : `${count} pages`;
}

const previewError = (
  <p role="alert" className="text-sm text-destructive">
    Couldn’t update the preview. Keep editing to try again.
  </p>
);

export function PdfPreview({ content }: { content: CvContent }) {
  const { blob, pending, failed } = usePdfBlob(content);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [pageCount, setPageCount] = useState<number | null>(null);

  return (
    <section aria-label="CV preview" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
        <p>
          <span className="font-medium tracking-[0.14em] text-foreground uppercase">Preview</span>
          {pageCount !== null && <> · {pageCountLabel(pageCount)} · A4</>}
        </p>
        <p aria-live="polite">{pending ? 'Updating…' : ''}</p>
      </div>
      {failed && previewError}
      <div ref={ref}>
        {blob && width > 0 ? (
          <ErrorBoundary fallback={previewError} resetKeys={[blob]}>
            <Suspense fallback={<PdfSheetSkeleton />}>
              <Document file={blob} onLoadSuccess={(pdf) => setPageCount(pdf.numPages)}>
                <PdfPages width={width} />
              </Document>
            </Suspense>
          </ErrorBoundary>
        ) : (
          <PdfSheetSkeleton />
        )}
      </div>
    </section>
  );
}
