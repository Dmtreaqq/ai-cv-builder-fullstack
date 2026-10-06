import '@testing-library/jest-dom/vitest';

// jsdom has no canvas or pdf.js worker, so the live PDF preview renders as a stub.
vi.mock('@/features/editor/pdf/pdf-preview', async () => {
  const { createElement } = await import('react');
  return { PdfPreview: () => createElement('section', { 'aria-label': 'CV preview' }) };
});

afterEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
});
