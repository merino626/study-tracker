import { Pencil, Trash2 } from 'lucide-react';
import type { StudySession } from '@shared/types/models';
import { Button } from '@/components/ui/button';
import { formatSessionDate, formatSessionTime } from '@/utils/date';
import { formatDurationShort } from '@/utils/time';

interface SessionItemProps {
  session: StudySession;
  onEdit?: (session: StudySession) => void;
  onDelete?: (session: StudySession) => void;
  readOnly?: boolean;
  courseName?: string;
}

export function SessionItem({
  session,
  onEdit,
  onDelete,
  readOnly = false,
  courseName,
}: SessionItemProps) {
  return (
    <div className="hover:bg-accent/40 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{formatSessionDate(session.startedAt)}</p>
        <p className="text-muted-foreground text-xs">
          {formatSessionTime(session.startedAt)} — {formatSessionTime(session.endedAt)}
        </p>
        {courseName && (
          <p className="text-muted-foreground truncate text-xs">Curso: {courseName}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <p className="text-sm font-semibold tabular-nums">
          {formatDurationShort(session.durationSeconds)}
        </p>
        {!readOnly && onEdit && onDelete && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(session)}
              title="Editar sessão"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(session)}
              title="Excluir sessão"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
