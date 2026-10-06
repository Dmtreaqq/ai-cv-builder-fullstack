import { useCallback, useEffect, useReducer, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import type { CvSummary } from './cv-types';
import { deleteCv, listCvs, updateCv } from './cvs-api';
import { POLL_INTERVAL_MS } from './use-cv';

type CvListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; cvs: CvSummary[] };

type CvListAction =
  | { type: 'loading' }
  | { type: 'loaded'; cvs: CvSummary[] }
  | { type: 'failed'; message: string }
  | { type: 'renamed'; id: string; title: string; updatedAt: string }
  | { type: 'deleted'; id: string };

function cvListReducer(state: CvListState, action: CvListAction): CvListState {
  switch (action.type) {
    case 'loading':
      return { status: 'loading' };
    case 'loaded':
      return { status: 'loaded', cvs: action.cvs };
    case 'failed':
      return state.status === 'loaded' ? state : { status: 'error', message: action.message };
    case 'renamed':
      if (state.status !== 'loaded') {
        return state;
      }
      return {
        ...state,
        cvs: state.cvs.map((cv) =>
          cv.id === action.id ? { ...cv, title: action.title, updatedAt: action.updatedAt } : cv,
        ),
      };
    case 'deleted':
      if (state.status !== 'loaded') {
        return state;
      }
      return { ...state, cvs: state.cvs.filter((cv) => cv.id !== action.id) };
  }
}

export function useCvList() {
  const [state, dispatch] = useReducer(cvListReducer, { status: 'loading' });
  const [fetchCount, setFetchCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listCvs(controller.signal).then(
      (cvs) => dispatch({ type: 'loaded', cvs }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          const message = error instanceof ApiError ? error.message : 'Couldn’t load your CVs.';
          dispatch({ type: 'failed', message });
        }
      },
    );
    return () => controller.abort();
  }, [fetchCount]);

  const hasGenerating =
    state.status === 'loaded' && state.cvs.some((cv) => cv.status === 'generating');

  useEffect(() => {
    if (!hasGenerating) {
      return;
    }
    const timer = window.setTimeout(() => setFetchCount((count) => count + 1), POLL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [hasGenerating, state]);

  const reload = useCallback(() => {
    dispatch({ type: 'loading' });
    setFetchCount((count) => count + 1);
  }, []);

  const rename = useCallback(async (id: string, title: string) => {
    const cv = await updateCv(id, { title });
    dispatch({ type: 'renamed', id, title: cv.title, updatedAt: cv.updatedAt });
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteCv(id);
    dispatch({ type: 'deleted', id });
  }, []);

  return { state, reload, rename, remove };
}
