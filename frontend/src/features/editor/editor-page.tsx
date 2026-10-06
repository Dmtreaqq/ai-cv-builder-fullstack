import type { Cv } from '@/features/cvs/cv-types';
import { EditorLayout } from './editor-layout';
import { EditorProvider } from './editor-provider';

export function EditorPage({ cv }: { cv: Cv }) {
  return (
    <EditorProvider cv={cv}>
      <EditorLayout />
    </EditorProvider>
  );
}
