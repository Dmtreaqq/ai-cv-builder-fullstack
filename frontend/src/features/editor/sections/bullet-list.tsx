import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExperienceEntry } from '@/features/cvs/cv-types';
import { createId } from '@/lib/create-id';
import { useEditor } from '../use-editor';
import { MoveButtons } from './move-buttons';
import { TextField } from './text-field';

interface BulletListProps {
  entry: ExperienceEntry;
  entryLabel: string;
}

export function BulletList({ entry, entryLabel }: BulletListProps) {
  const { dispatch } = useEditor();
  const headingId = `bullets-${entry.id}`;

  return (
    <div className="flex flex-col gap-2">
      <p id={headingId} className="text-sm font-medium">
        Highlights
      </p>
      {entry.bullets.length > 0 && (
        <ul aria-labelledby={headingId} className="flex flex-col gap-3">
          {entry.bullets.map((bullet, index) => (
            <li key={bullet.id} className="flex items-start gap-1">
              <TextField
                className="flex-1"
                multiline
                hideLabel
                label={`Highlight ${index + 1} for ${entryLabel}`}
                placeholder="What you did and what came of it"
                fieldRef={{ section: 'experience', entryId: entry.id, bulletId: bullet.id }}
              />
              <MoveButtons
                vertical
                label={`highlight ${index + 1}`}
                index={index}
                count={entry.bullets.length}
                onMove={(offset) =>
                  dispatch({ type: 'moveBullet', entryId: entry.id, bulletId: bullet.id, offset })
                }
                onRemove={() =>
                  dispatch({ type: 'removeBullet', entryId: entry.id, bulletId: bullet.id })
                }
              />
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => dispatch({ type: 'addBullet', entryId: entry.id, id: createId() })}
      >
        <Plus data-icon="inline-start" />
        Add highlight
      </Button>
    </div>
  );
}
