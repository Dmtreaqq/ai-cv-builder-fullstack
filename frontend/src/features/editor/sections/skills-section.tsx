import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createId } from '@/lib/create-id';
import { cn } from '@/lib/utils';
import { HIGHLIGHT_CLASSES } from '../highlight-classes';
import { useEditor } from '../use-editor';
import { SectionCard } from './section-card';

export function SkillsSection() {
  const { content, highlight, dispatch } = useEditor();
  const [draft, setDraft] = useState('');
  const list = useRef<HTMLUListElement>(null);
  const highlighted = highlight === 'skills';

  useEffect(() => {
    if (highlighted) {
      list.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    }
  }, [highlighted]);

  function addSkills() {
    const existing = new Set(content.skills.map((skill) => skill.name.toLowerCase()));
    for (const name of draft.split(',').map((part) => part.trim())) {
      if (name && !existing.has(name.toLowerCase())) {
        existing.add(name.toLowerCase());
        dispatch({ type: 'addSkill', id: createId(), name });
      }
    }
    setDraft('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSkills();
    }
  }

  return (
    <SectionCard id="skills" title="Skills">
      {content.skills.length > 0 && (
        <ul
          ref={list}
          aria-label="Skills"
          className={cn(
            '-m-2 flex flex-wrap gap-2 rounded-xl border border-transparent p-2 transition-[box-shadow,background-color,border-color] duration-500',
            highlighted && HIGHLIGHT_CLASSES,
          )}
        >
          {content.skills.map((skill) => (
            <li
              key={skill.id}
              className="inline-flex items-center gap-0.5 rounded-full bg-secondary py-0.5 pr-0.5 pl-3 text-sm"
            >
              {skill.name}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${skill.name}`}
                onClick={() => dispatch({ type: 'removeSkill', skillId: skill.id })}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-skill">Add skills</Label>
        <div className="flex gap-2">
          <Input
            id="new-skill"
            value={draft}
            placeholder="e.g. PostgreSQL, Terraform"
            className="bg-background/40"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button type="button" variant="outline" onClick={addSkills} disabled={!draft.trim()}>
            <Plus data-icon="inline-start" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Separate several with commas.</p>
      </div>
    </SectionCard>
  );
}
