import { createContext, type Dispatch } from 'react';
import type { CvContent, Question } from '@/features/cvs/cv-types';
import type { EditorAction } from './editor-reducer';
import type { SaveStatus } from './use-autosave';

export interface EditorContextValue {
  cvId: string;
  title: string;
  targetRole: string;
  content: CvContent;
  questions: Question[];
  highlight: string | null;
  dispatch: Dispatch<EditorAction>;
  saveStatus: SaveStatus;
  flush: () => Promise<void>;
}

export const EditorContext = createContext<EditorContextValue | null>(null);
