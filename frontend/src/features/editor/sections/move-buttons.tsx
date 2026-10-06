import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MoveButtonsProps {
  label: string;
  index: number;
  count: number;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
  vertical?: boolean;
}

export function MoveButtons({ label, index, count, onMove, onRemove, vertical }: MoveButtonsProps) {
  return (
    <div className={cn('flex shrink-0 gap-0.5', vertical && 'flex-col')}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Move ${label} up`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove ${label}`}
        className="hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
