import { MAX_PDF_BYTES, validateComposer } from './validate-composer';

const pdf = { name: 'cv.pdf', type: 'application/pdf', size: 1_000 };

describe('validateComposer', () => {
  it('accepts a role with text or a PDF', () => {
    expect(validateComposer({ targetRole: 'Engineer', sourceText: 'Hi', file: null })).toEqual({});
    expect(validateComposer({ targetRole: 'Engineer', sourceText: '', file: pdf })).toEqual({});
  });

  it('requires a role of 2 to 100 characters', () => {
    expect(validateComposer({ targetRole: ' ', sourceText: 'Hi', file: null })).toEqual({
      targetRole: 'Enter the role you’re applying for.',
    });
    expect(validateComposer({ targetRole: 'B', sourceText: 'Hi', file: null })).toEqual({
      targetRole: 'Keep the role between 2 and 100 characters.',
    });
    expect(validateComposer({ targetRole: 'x'.repeat(101), sourceText: 'Hi', file: null })).toEqual(
      { targetRole: 'Keep the role between 2 and 100 characters.' },
    );
  });

  it('limits the background to 30,000 characters', () => {
    expect(
      validateComposer({ targetRole: 'Engineer', sourceText: 'x'.repeat(30_001), file: null }),
    ).toEqual({ source: 'Keep your background under 30,000 characters.' });
  });

  it('checks the attached file', () => {
    expect(
      validateComposer({
        targetRole: 'Engineer',
        sourceText: '',
        file: { name: 'cv.docx', type: 'application/msword', size: 10 },
      }),
    ).toEqual({ file: 'Attach a PDF file.' });
    expect(
      validateComposer({
        targetRole: 'Engineer',
        sourceText: '',
        file: { ...pdf, size: MAX_PDF_BYTES + 1 },
      }),
    ).toEqual({ file: 'The PDF must be 5 MB or smaller.' });
  });
});
