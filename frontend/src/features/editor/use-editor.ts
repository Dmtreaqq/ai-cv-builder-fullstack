import { use } from 'react';
import { EditorContext } from './editor-context';

export function useEditor() {
  const context = use(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
