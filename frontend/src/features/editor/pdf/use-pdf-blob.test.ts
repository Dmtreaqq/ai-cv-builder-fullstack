import { act, renderHook } from '@testing-library/react';
import type { CvContent } from '@/features/cvs/cv-types';
import { renderCvPdf } from './render-cv-pdf';
import { PDF_PREVIEW_DELAY_MS, usePdfBlob } from './use-pdf-blob';

vi.mock('./render-cv-pdf', () => ({ renderCvPdf: vi.fn() }));

const renderMock = vi.mocked(renderCvPdf);

function content(summary: string) {
  return { summary } as CvContent;
}

function deferred() {
  let resolve!: (blob: Blob) => void;
  const promise = new Promise<Blob>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('usePdfBlob', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    renderMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders right away, then debounces edits into one render', async () => {
    renderMock.mockResolvedValue(new Blob(['pdf']));
    const { result, rerender } = renderHook(({ value }) => usePdfBlob(value), {
      initialProps: { value: content('a') },
    });

    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(false);

    const latest = content('abc');
    rerender({ value: content('ab') });
    rerender({ value: latest });
    expect(result.current.pending).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(PDF_PREVIEW_DELAY_MS));

    expect(renderMock).toHaveBeenCalledTimes(2);
    expect(renderMock).toHaveBeenLastCalledWith(latest);
    expect(result.current.pending).toBe(false);
  });

  it('ignores a render that finishes after newer content arrived', async () => {
    const first = deferred();
    const second = deferred();
    renderMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(({ value }) => usePdfBlob(value), {
      initialProps: { value: content('old') },
    });
    await act(() => vi.advanceTimersByTimeAsync(0));

    rerender({ value: content('new') });
    await act(() => vi.advanceTimersByTimeAsync(PDF_PREVIEW_DELAY_MS));
    const fresh = new Blob(['new']);
    await act(async () => second.resolve(fresh));
    await act(async () => first.resolve(new Blob(['old'])));

    expect(result.current.blob).toBe(fresh);
  });

  it('reports a failed render and keeps the last good PDF', async () => {
    const good = new Blob(['good']);
    renderMock.mockResolvedValueOnce(good).mockRejectedValueOnce(new Error('boom'));
    const { result, rerender } = renderHook(({ value }) => usePdfBlob(value), {
      initialProps: { value: content('a') },
    });
    await act(() => vi.advanceTimersByTimeAsync(0));

    rerender({ value: content('b') });
    await act(() => vi.advanceTimersByTimeAsync(PDF_PREVIEW_DELAY_MS));

    expect(result.current.failed).toBe(true);
    expect(result.current.blob).toBe(good);
  });
});
