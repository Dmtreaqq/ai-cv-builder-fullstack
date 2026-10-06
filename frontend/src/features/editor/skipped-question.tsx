import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Question } from '@/features/cvs/cv-types';
import { useEditor } from './use-editor';

export function SkippedQuestion({ question }: { question: Question }) {
  const { reopen } = useEditor();
  const [pending, setPending] = useState(false);

  async function handleReopen() {
    setPending(true);
    try {
      await reopen(question.id);
    } catch {
      setPending(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="min-w-0 text-muted-foreground">{question.prompt}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        aria-label={`Reopen: ${question.prompt}`}
        onClick={handleReopen}
      >
        Reopen
      </Button>
    </li>
  );
}
