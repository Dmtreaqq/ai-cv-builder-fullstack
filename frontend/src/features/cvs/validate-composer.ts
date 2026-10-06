export const MAX_PDF_BYTES = 5 * 1024 * 1024;

export interface ComposerInput {
  targetRole: string;
  sourceText: string;
  file: Pick<File, 'name' | 'type' | 'size'> | null;
}

export type ComposerErrors = Partial<Record<'targetRole' | 'source' | 'file', string>>;

export function validatePdf(file: Pick<File, 'name' | 'type' | 'size'>): string | undefined {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return 'Attach a PDF file.';
  }
  if (file.size > MAX_PDF_BYTES) {
    return 'The PDF must be 5 MB or smaller.';
  }
  return undefined;
}

export function validateComposer({ targetRole, sourceText, file }: ComposerInput): ComposerErrors {
  const errors: ComposerErrors = {};
  if (!targetRole.trim()) {
    errors.targetRole = 'Enter the role you’re applying for.';
  }
  if (!sourceText.trim() && !file) {
    errors.source = 'Describe your background or attach your current CV as a PDF.';
  }
  const fileError = file ? validatePdf(file) : undefined;
  if (fileError) {
    errors.file = fileError;
  }
  return errors;
}
