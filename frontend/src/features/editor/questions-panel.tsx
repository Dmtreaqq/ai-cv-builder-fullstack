import { visibleQuestions } from '@/features/cvs/field-ref';
import { QuestionItem } from './question-item';
import { SkippedQuestion } from './skipped-question';
import { useEditor } from './use-editor';

export function QuestionsPanel() {
  const { content, questions } = useEditor();
  const visible = visibleQuestions(content, questions);
  const open = visible.filter((question) => question.status === 'open');
  const skipped = visible.filter((question) => question.status === 'skipped');

  if (open.length === 0 && skipped.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="questions-heading"
      className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-xs ring-1 ring-brand/30 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-brand uppercase">
          <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
          Needs your input
        </p>
        <h2 id="questions-heading" className="text-2xl tracking-tight">
          {open.length > 0
            ? `${open.length} ${open.length === 1 ? 'detail' : 'details'} would make this stronger`
            : 'All caught up'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {open.length > 0
            ? 'Answer and we’ll work it into your CV. Skip anything that doesn’t apply.'
            : 'You can reopen anything you skipped.'}
        </p>
      </div>
      {open.length > 0 && (
        <ol className="flex flex-col divide-y divide-border">
          {open.map((question) => (
            <QuestionItem key={question.id} question={question} />
          ))}
        </ol>
      )}
      {skipped.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p id="skipped-heading" className="text-xs font-medium text-muted-foreground">
            Skipped
          </p>
          <ul aria-labelledby="skipped-heading" className="flex flex-col gap-1">
            {skipped.map((question) => (
              <SkippedQuestion key={question.id} question={question} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
