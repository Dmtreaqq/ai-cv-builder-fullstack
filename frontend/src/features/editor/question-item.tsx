import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Question } from '@/features/cvs/cv-types';
import { ApiError } from '@/lib/api-client';
import { useEditor } from './use-editor';

export function QuestionItem({ question }: { question: Question }) {
  const { answer, skip } = useEditor();
  const [value, setValue] = useState('');
  const [pending, setPending] = useState<'answer' | 'skip' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputId = `answer-${question.id}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  async function run(kind: 'answer' | 'skip', action: () => Promise<void>) {
    setPending(kind);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Something went wrong. Try again.');
      setPending(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value.trim()) {
      void run('answer', () => answer(question.id, value.trim()));
    }
  }

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Label htmlFor={inputId} className="text-base leading-snug">
          {question.prompt}
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={inputId}
            value={value}
            disabled={pending !== null}
            className="bg-background/40"
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [question.hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
            }
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="flex shrink-0 gap-2">
            <Button type="submit" disabled={pending !== null || !value.trim()}>
              {pending === 'answer' ? 'Applying…' : 'Apply'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending !== null}
              onClick={() => void run('skip', () => skip(question.id))}
            >
              {pending === 'skip' ? 'Skipping…' : 'Skip'}
            </Button>
          </div>
        </div>
        {question.hint && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {question.hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </li>
  );
}
