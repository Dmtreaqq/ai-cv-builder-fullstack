import { useEffect, useRef, useState, useTransition } from 'react';
import type { CvContent } from '@/features/cvs/cv-types';
import { renderCvPdf } from './render-cv-pdf';

export const PDF_PREVIEW_DELAY_MS = 400;

interface PdfResult {
  content: CvContent;
  blob: Blob | null;
  failed: boolean;
}

export function usePdfBlob(content: CvContent) {
  const [result, setResult] = useState<PdfResult | null>(null);
  const [transitioning, startTransition] = useTransition();
  const firstRun = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const delay = firstRun.current ? 0 : PDF_PREVIEW_DELAY_MS;
    firstRun.current = false;

    const timer = window.setTimeout(() => {
      renderCvPdf(content).then(
        (blob) => {
          if (!cancelled) {
            startTransition(() => setResult({ content, blob, failed: false }));
          }
        },
        () => {
          if (!cancelled) {
            setResult((previous) => ({ content, blob: previous?.blob ?? null, failed: true }));
          }
        },
      );
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [content]);

  return {
    blob: result?.blob ?? null,
    failed: result?.content === content && result.failed,
    pending: result?.content !== content || transitioning,
  };
}
