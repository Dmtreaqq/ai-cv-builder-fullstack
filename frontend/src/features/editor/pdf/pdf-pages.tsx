import { Page, useDocumentContext } from 'react-pdf';

export function PdfPages({ width }: { width: number }) {
  const context = useDocumentContext();
  const pageCount = context?.pdf ? context.pdf.numPages : 0;

  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: pageCount }, (_, index) => (
        <Page
          key={index}
          pageNumber={index + 1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="overflow-hidden bg-card shadow-xl shadow-foreground/10 ring-1 ring-border"
        />
      ))}
    </div>
  );
}
