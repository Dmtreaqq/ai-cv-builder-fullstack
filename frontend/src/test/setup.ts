import '@testing-library/jest-dom/vitest';
import { server } from '@/mocks/server';

// jsdom has no canvas or pdf.js worker, so the live PDF preview renders as a stub.
vi.mock('@/features/editor/pdf/pdf-preview', async () => {
  const { createElement } = await import('react');
  return { PdfPreview: () => createElement('section', { 'aria-label': 'CV preview' }) };
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});

afterAll(() => server.close());
