import { useCallback, useEffect, useRef, useState } from 'react';
import type { CvContent } from '@/features/cvs/cv-types';
import { updateCv } from '@/features/cvs/cvs-api';

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error';

export const AUTOSAVE_DELAY_MS = 800;

export function useAutosave(cvId: string, content: CvContent) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const latest = useRef(content);
  const saved = useRef(content);
  const timer = useRef<number | undefined>(undefined);
  const inflight = useRef<Promise<void> | null>(null);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    while (inflight.current) {
      await inflight.current;
    }
    const snapshot = latest.current;
    if (snapshot === saved.current) {
      return;
    }
    setStatus('saving');
    inflight.current = updateCv(cvId, { content: snapshot })
      .then(
        () => {
          saved.current = snapshot;
          setStatus(latest.current === snapshot ? 'saved' : 'pending');
        },
        () => setStatus('error'),
      )
      .finally(() => {
        inflight.current = null;
      });
    await inflight.current;
  }, [cvId]);

  useEffect(() => {
    latest.current = content;
    if (content === saved.current) {
      return;
    }
    setStatus((current) => (current === 'saving' ? current : 'pending'));
    timer.current = window.setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer.current);
  }, [content, flush]);

  useEffect(
    () => () => {
      if (latest.current !== saved.current) {
        void flush();
      }
    },
    [flush],
  );

  const dirty = status !== 'saved';
  useEffect(() => {
    if (!dirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return { status, flush };
}
