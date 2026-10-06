import { Paperclip } from 'lucide-react';

export function ComposerPreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl bg-card shadow-sm ring-1 ring-border select-none"
    >
      <p className="min-h-20 px-5 pt-4 pb-6 text-muted-foreground">Describe your background…</p>
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm">
          <Paperclip className="size-3.5" />
          Upload CV (PDF)
        </span>
        <span className="rounded-full px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border">
          Target role: <span className="text-foreground">e.g. Product Designer</span>
        </span>
      </div>
    </div>
  );
}
