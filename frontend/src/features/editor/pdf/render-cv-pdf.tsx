import { pdf } from '@react-pdf/renderer';
import type { CvContent } from '@/features/cvs/cv-types';
import { CvDocument } from './cv-document';
import { readPdfColors } from './pdf-colors';

let queue: Promise<unknown> = Promise.resolve();

// react-pdf shares font and layout state between renders, so run them one at a time.
export function renderCvPdf(content: CvContent): Promise<Blob> {
  const run = queue.then(() =>
    pdf(<CvDocument content={content} colors={readPdfColors()} />).toBlob(),
  );
  queue = run.catch(() => undefined);
  return run;
}
