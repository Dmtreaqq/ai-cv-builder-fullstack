import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createId } from '@/lib/create-id';
import { useEditor } from '../use-editor';
import { MoveButtons } from './move-buttons';
import { SectionCard } from './section-card';
import { TextField } from './text-field';

export function EducationSection() {
  const { content, dispatch } = useEditor();
  const { education } = content;

  return (
    <SectionCard id="education" title="Education">
      {education.length > 0 && (
        <ol className="flex flex-col gap-4">
          {education.map((entry, index) => {
            const label =
              [entry.degree, entry.school].filter(Boolean).join(', ') || `Education ${index + 1}`;
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
                    count={education.length}
                    onMove={(offset) =>
                      dispatch({
                        type: 'moveEntry',
                        section: 'education',
                        entryId: entry.id,
                        offset,
                      })
                    }
                    onRemove={() =>
                      dispatch({ type: 'removeEntry', section: 'education', entryId: entry.id })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Degree"
                    fieldRef={{ section: 'education', entryId: entry.id, field: 'degree' }}
                  />
                  <TextField
                    label="School"
                    fieldRef={{ section: 'education', entryId: entry.id, field: 'school' }}
                  />
                  <TextField
                    label="Start"
                    placeholder="2012"
                    fieldRef={{ section: 'education', entryId: entry.id, field: 'start' }}
                  />
                  <TextField
                    label="End"
                    placeholder="2016"
                    fieldRef={{ section: 'education', entryId: entry.id, field: 'end' }}
                  />
                  <TextField
                    className="sm:col-span-2"
                    multiline
                    label="Details"
                    placeholder="Thesis, honors, relevant coursework"
                    fieldRef={{ section: 'education', entryId: entry.id, field: 'details' }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => dispatch({ type: 'addEntry', section: 'education', id: createId() })}
      >
        <Plus data-icon="inline-start" />
        Add education
      </Button>
    </SectionCard>
  );
}
