import { Columns2, PanelTop } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditorLayoutMode } from './use-editor-layout-mode';

const OPTIONS = [
  { value: 'split', label: 'Side by side', Icon: Columns2 },
  { value: 'tabs', label: 'Tabs', Icon: PanelTop },
] as const;

interface LayoutModeToggleProps {
  mode: EditorLayoutMode;
  onChange: (mode: EditorLayoutMode) => void;
}

export function LayoutModeToggle({ mode, onChange }: LayoutModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Editor layout"
      className="hidden items-center gap-0.5 rounded-full bg-muted p-0.5 lg:flex"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
            mode === value && 'bg-card text-foreground shadow-xs',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
