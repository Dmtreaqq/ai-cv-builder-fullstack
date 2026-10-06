import { ArrowRight, Paperclip, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { createCv } from './cvs-api';
import { validateComposer, validatePdf, type ComposerErrors } from './validate-composer';

const ERROR_IDS = {
  source: 'composer-source-error',
  file: 'composer-file-error',
  targetRole: 'composer-role-error',
};

export function NewCvPage() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [sourceText, setSourceText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ComposerErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!selected) {
      return;
    }
    const fileError = validatePdf(selected);
    setErrors((current) => ({
      ...current,
      file: fileError,
      source: fileError ? current.source : undefined,
    }));
    if (!fileError) {
      setFile(selected);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { sourceText: sourceText.trim(), targetRole: targetRole.trim(), file };
    const nextErrors = validateComposer(input);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setPending(true);
    try {
      const cv = await createCv(input);
      navigate(`/cvs/${cv.id}`);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Couldn’t start your CV. Try again.',
      );
      setPending(false);
    }
  }

  const sourceDescribedBy = [errors.source && ERROR_IDS.source, errors.file && ERROR_IDS.file]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-10 sm:py-14">
      <PageHeader
        backTo="/cvs"
        backLabel="All CVs"
        title="New CV"
        meta="Tell us where you’re coming from and the role you want next."
      />
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div
          className={cn(
            'rounded-2xl bg-card shadow-sm ring-1 ring-border transition-shadow focus-within:ring-ring/60',
            (errors.source || errors.file) && 'ring-destructive/60',
          )}
        >
          <label htmlFor="source-text" className="sr-only">
            Your background
          </label>
          <textarea
            id="source-text"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="Describe your background: roles, companies, what you built and what came of it…"
            aria-invalid={errors.source ? true : undefined}
            aria-describedby={sourceDescribedBy || undefined}
            className="block field-sizing-content max-h-[60svh] min-h-44 w-full resize-none rounded-t-2xl bg-transparent px-5 pt-4 pb-6 outline-none placeholder:text-muted-foreground"
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-3">
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
              onChange={handleFileChange}
            />
            {file ? (
              <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-secondary py-1 pr-1 pl-3 text-sm">
                <Paperclip className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFile(null)}
                >
                  <X />
                </Button>
              </span>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInput.current?.click()}
              >
                <Paperclip data-icon="inline-start" />
                Attach PDF
              </Button>
            )}
            <label
              className={cn(
                'flex min-w-0 flex-1 basis-60 items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border focus-within:ring-2 focus-within:ring-ring/60',
                errors.targetRole && 'ring-destructive/60',
              )}
            >
              <span className="whitespace-nowrap">Target role</span>
              <input
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                maxLength={100}
                aria-invalid={errors.targetRole ? true : undefined}
                aria-describedby={errors.targetRole ? ERROR_IDS.targetRole : undefined}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/70"
              />
            </label>
          </div>
        </div>
        {(errors.source || errors.file || errors.targetRole) && (
          <ul className="flex flex-col gap-1 text-sm text-destructive">
            {errors.source && <li id={ERROR_IDS.source}>{errors.source}</li>}
            {errors.file && <li id={ERROR_IDS.file}>{errors.file}</li>}
            {errors.targetRole && <li id={ERROR_IDS.targetRole}>{errors.targetRole}</li>}
          </ul>
        )}
        <p className="text-sm text-muted-foreground">
          Attach a PDF of up to 5 MB, write a few paragraphs, or both.
        </p>
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        <div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Starting…' : 'Generate CV'}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </form>
    </section>
  );
}
