import { useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { Cv } from '@/features/cvs/cv-types';
import { EditorContext } from './editor-context';
import { editorReducer, type EditorState } from './editor-reducer';
import { useAutosave } from './use-autosave';

export const HIGHLIGHT_MS = 2_000;

interface EditorProviderProps {
  cv: Cv;
  children: ReactNode;
}

function initEditor(cv: Cv): EditorState {
  if (!cv.content) {
    throw new Error('EditorProvider needs a CV with content');
  }
  return { content: cv.content, questions: cv.questions, highlight: null };
}

export function EditorProvider({ cv, children }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, cv, initEditor);
  const { status: saveStatus, flush } = useAutosave(cv.id, state.content);

  useEffect(() => {
    if (!state.highlight) {
      return;
    }
    const timer = window.setTimeout(() => dispatch({ type: 'clearHighlight' }), HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [state.highlight]);

  const value = useMemo(
    () => ({
      cvId: cv.id,
      title: cv.title,
      targetRole: cv.targetRole,
      ...state,
      dispatch,
      saveStatus,
      flush,
    }),
    [cv.id, cv.title, cv.targetRole, state, saveStatus, flush],
  );

  return <EditorContext value={value}>{children}</EditorContext>;
}
