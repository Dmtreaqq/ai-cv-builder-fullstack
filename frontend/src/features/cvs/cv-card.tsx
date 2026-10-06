import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { CvStatusBadge } from './cv-status-badge';
import type { CvSummary } from './cv-types';
import { DeleteCvDialog } from './delete-cv-dialog';
import { RenameCvDialog } from './rename-cv-dialog';

interface CvCardProps {
  cv: CvSummary;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function CvCard({ cv, onRename, onDelete }: CvCardProps) {
  const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null);

  const closeDialog = () => setDialog(null);

  return (
    <article className="relative flex min-h-44 flex-col gap-6 rounded-2xl bg-card p-5 shadow-xs ring-1 ring-border transition-shadow has-[a:hover]:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xl leading-snug tracking-tight">
            <Link
              to={`/cvs/${cv.id}`}
              className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {cv.title}
            </Link>
          </h2>
          <p className="truncate text-sm text-muted-foreground">{cv.targetRole}</p>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative z-10 -mt-1 -mr-2"
              aria-label={`Actions for ${cv.title}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => setDialog('rename')}>
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <CvStatusBadge cv={cv} />
        <span className="text-xs text-muted-foreground">
          Edited {formatRelativeTime(cv.updatedAt)}
        </span>
      </div>
      {dialog === 'rename' && (
        <RenameCvDialog title={cv.title} onClose={closeDialog} onRename={onRename} />
      )}
      {dialog === 'delete' && (
        <DeleteCvDialog title={cv.title} onClose={closeDialog} onDelete={onDelete} />
      )}
    </article>
  );
}
