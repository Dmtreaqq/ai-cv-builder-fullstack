import { useState, type FormEvent } from 'react';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';

interface RenameCvDialogProps {
  title: string;
  onClose: () => void;
  onRename: (title: string) => Promise<void>;
}

export function RenameCvDialog({ title, onClose, onRename }: RenameCvDialogProps) {
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = value.trim();
    if (!next) {
      setError('Enter a title.');
      return;
    }
    setPending(true);
    try {
      await onRename(next);
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Couldn’t rename the CV. Try again.');
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form noValidate onSubmit={handleSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Rename CV</DialogTitle>
            <DialogDescription>Only you see this title.</DialogDescription>
          </DialogHeader>
          <FormField id="cv-title" label="Title" error={error}>
            {(props) => (
              <Input
                {...props}
                autoFocus
                maxLength={120}
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            )}
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
