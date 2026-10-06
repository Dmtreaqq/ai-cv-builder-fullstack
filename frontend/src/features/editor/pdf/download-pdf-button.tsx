import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEditor } from '../use-editor';
import { pdfFileName } from './pdf-file-name';

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function DownloadPdfButton({ size = 'default' }: { size?: 'default' | 'sm' }) {
  const { content, targetRole } = useEditor();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setPending(true);
    setFailed(false);
    try {
      const { renderCvPdf } = await import('./render-cv-pdf');
      const blob = await renderCvPdf(content);
      saveBlob(blob, pdfFileName(content.contact.fullName, targetRole));
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size={size} onClick={handleClick} disabled={pending}>
        <Download data-icon="inline-start" />
        {pending ? 'Preparing…' : 'Download PDF'}
      </Button>
      {failed && (
        <p role="alert" className="text-xs text-destructive">
          Couldn’t create the PDF. Try again.
        </p>
      )}
    </div>
  );
}
