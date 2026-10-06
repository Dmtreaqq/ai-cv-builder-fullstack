import { useState } from 'react';

export type EditorLayoutMode = 'split' | 'tabs';

const STORAGE_KEY = 'cv-editor-layout';

function readMode(): EditorLayoutMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'tabs' ? 'tabs' : 'split';
  } catch {
    return 'split';
  }
}

export function useEditorLayoutMode() {
  const [mode, setMode] = useState(readMode);

  function changeMode(next: EditorLayoutMode) {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit only.
    }
  }

  return [mode, changeMode] as const;
}
