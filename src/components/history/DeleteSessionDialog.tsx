import { useState } from 'react';
import type { StudySession } from '@shared/types/models';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatSessionDate, formatSessionTime } from '@/utils/date';
import { formatDurationShort } from '@/utils/time';

interface DeleteSessionDialogProps {
  session: StudySession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sessionId: string) => Promise<void>;
}

export function DeleteSessionDialog({
  session,
  open,
  onOpenChange,
  onConfirm,
}: DeleteSessionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!session) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm(session.id);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir sessão';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir sessão</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A sessão será removida permanentemente.
          </DialogDescription>
        </DialogHeader>

        {session && (
          <div className="bg-muted space-y-1 rounded-lg px-3 py-2 text-sm">
            <p className="font-medium">{formatSessionDate(session.startedAt)}</p>
            <p className="text-muted-foreground text-xs">
              {formatSessionTime(session.startedAt)} — {formatSessionTime(session.endedAt)}
            </p>
            <p className="font-medium tabular-nums">
              {formatDurationShort(session.durationSeconds)}
            </p>
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void handleConfirm()} disabled={isDeleting}>
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
