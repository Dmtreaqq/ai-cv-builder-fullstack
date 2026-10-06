import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { Cv } from '@/features/cvs/cv-types';
import { answerQuestion, reopenQuestion, skipQuestion } from '@/features/cvs/cvs-api';
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

  const answer = useCallback(
    async (questionId: string, text: string) => {
      // The server applies the answer to its copy, so it must have every pending edit first.
      await flush();
      const result = await answerQuestion(cv.id, questionId, text);
      if (result.cv.content) {
        dispatch({
          type: 'applyChange',
          content: result.cv.content,
          changed: result.changed,
          questions: result.cv.questions,
        });
      }
    },
    [cv.id, flush],
  );

  const skip = useCallback(
    async (questionId: string) => {
      const updated = await skipQuestion(cv.id, questionId);
      dispatch({ type: 'setQuestions', questions: updated.questions });
    },
    [cv.id],
  );

  const reopen = useCallback(
    async (questionId: string) => {
      const updated = await reopenQuestion(cv.id, questionId);
      dispatch({ type: 'setQuestions', questions: updated.questions });
    },
    [cv.id],
  );

  const value = useMemo(
    () => ({
      cvId: cv.id,
      title: cv.title,
      targetRole: cv.targetRole,
      ...state,
      dispatch,
      saveStatus,
      flush,
      answer,
      skip,
      reopen,
    }),
    [cv.id, cv.title, cv.targetRole, state, saveStatus, flush, answer, skip, reopen],
  );

  return <EditorContext value={value}>{children}</EditorContext>;
}
