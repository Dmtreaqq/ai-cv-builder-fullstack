export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MIN_ROLE_LENGTH = 2;
export const MAX_ROLE_LENGTH = 100;
export const MAX_SOURCE_TEXT_LENGTH = 30_000;

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
  const role = targetRole.trim();
  if (!role) {
    errors.targetRole = 'Enter the role you’re applying for.';
  } else if (role.length < MIN_ROLE_LENGTH || role.length > MAX_ROLE_LENGTH) {
    errors.targetRole = `Keep the role between ${MIN_ROLE_LENGTH} and ${MAX_ROLE_LENGTH} characters.`;
  }
  if (!sourceText.trim() && !file) {
    errors.source = 'Describe your background or attach your current CV as a PDF.';
  } else if (sourceText.trim().length > MAX_SOURCE_TEXT_LENGTH) {
    errors.source = 'Keep your background under 30,000 characters.';
  }
  const fileError = file ? validatePdf(file) : undefined;
  if (fileError) {
    errors.file = fileError;
  }
  return errors;
}
