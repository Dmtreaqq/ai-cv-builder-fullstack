import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createId } from '@/lib/create-id';
import { useEditor } from '../use-editor';
import { BulletList } from './bullet-list';
import { MoveButtons } from './move-buttons';
import { SectionCard } from './section-card';
import { TextField } from './text-field';

export function ExperienceSection() {
  const { content, dispatch } = useEditor();
  const { experience } = content;

  return (
    <SectionCard id="experience" title="Experience" description="Most relevant first.">
      {experience.length > 0 && (
        <ol className="flex flex-col gap-4">
          {experience.map((entry, index) => {
            const label =
              [entry.role, entry.company].filter(Boolean).join(' at ') || `Job ${index + 1}`;
            return (
              <li
                key={entry.id}
                className="flex flex-col gap-4 rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-medium">{label}</p>
                  <MoveButtons
                    label={label}
                    index={index}
                    count={experience.length}
                    onMove={(offset) =>
                      dispatch({
                        type: 'moveEntry',
                        section: 'experience',
                        entryId: entry.id,
                        offset,
                      })
                    }
                    onRemove={() =>
                      dispatch({ type: 'removeEntry', section: 'experience', entryId: entry.id })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Role"
                    fieldRef={{ section: 'experience', entryId: entry.id, field: 'role' }}
                  />
                  <TextField
                    label="Company"
                    fieldRef={{ section: 'experience', entryId: entry.id, field: 'company' }}
                  />
                  <TextField
                    label="Location"
                    fieldRef={{ section: 'experience', entryId: entry.id, field: 'location' }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="Start"
                      placeholder="Mar 2021"
                      fieldRef={{ section: 'experience', entryId: entry.id, field: 'start' }}
                    />
                    <TextField
                      label="End"
                      placeholder="Present"
                      fieldRef={{ section: 'experience', entryId: entry.id, field: 'end' }}
                    />
                  </div>
                </div>
                <BulletList entry={entry} entryLabel={label} />
              </li>
            );
          })}
        </ol>
      )}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => dispatch({ type: 'addEntry', section: 'experience', id: createId() })}
      >
        <Plus data-icon="inline-start" />
        Add job
      </Button>
    </SectionCard>
  );
}
