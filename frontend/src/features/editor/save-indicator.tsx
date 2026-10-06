import { useEditor } from './use-editor';

const LABELS = {
  saved: 'Saved',
  pending: 'Saving…',
  saving: 'Saving…',
  error: 'Couldn’t save.',
};

export function SaveIndicator() {
  const { saveStatus, flush } = useEditor();

  return (
    <span role="status" className="inline-flex items-center gap-1.5">
      {LABELS[saveStatus]}
      {saveStatus === 'error' && (
        <button
          type="button"
          onClick={() => void flush()}
          className="text-brand underline underline-offset-4 hover:no-underline"
        >
          Retry
        </button>
      )}
    </span>
  );
}
