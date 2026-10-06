import { useState, type MouseEvent } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ApiError } from '@/lib/api-client';

interface DeleteCvDialogProps {
  title: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export function DeleteCvDialog({ title, onClose, onDelete }: DeleteCvDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleDelete(event: MouseEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      await onDelete();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Couldn’t delete the CV. Try again.');
      setPending(false);
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Delete “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The CV and your answers are removed for good. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={handleDelete}>
            {pending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
