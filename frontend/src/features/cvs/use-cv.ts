import { useCallback, useEffect, useReducer, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import type { Cv } from './cv-types';
import { getCv, retryCv } from './cvs-api';

export const POLL_INTERVAL_MS = 1_500;

type CvState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; cv: Cv };

type CvAction =
  | { type: 'loading' }
  | { type: 'loaded'; cv: Cv }
  | { type: 'not-found' }
  | { type: 'failed'; message: string };

function cvReducer(_state: CvState, action: CvAction): CvState {
  switch (action.type) {
    case 'loading':
      return { status: 'loading' };
    case 'loaded':
      return { status: 'loaded', cv: action.cv };
    case 'not-found':
      return { status: 'not-found' };
    case 'failed':
      return { status: 'error', message: action.message };
  }
}

export function useCv(id: string) {
  const [state, dispatch] = useReducer(cvReducer, { status: 'loading' });
  const [run, setRun] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;

    async function load() {
      try {
        const cv = await getCv(id, controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        dispatch({ type: 'loaded', cv });
        if (cv.status === 'generating') {
          timer = window.setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          dispatch({ type: 'not-found' });
        } else {
          const message = error instanceof ApiError ? error.message : 'Couldn’t load this CV.';
          dispatch({ type: 'failed', message });
        }
      }
    }

    void load();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [id, run]);

  const retry = useCallback(async () => {
    dispatch({ type: 'loaded', cv: await retryCv(id) });
    setRun((count) => count + 1);
  }, [id]);

  const reload = useCallback(() => {
    dispatch({ type: 'loading' });
    setRun((count) => count + 1);
  }, []);

  return { state, retry, reload };
}
