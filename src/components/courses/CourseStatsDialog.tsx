import type { CourseStats } from '@shared/types/models';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { SessionList } from '@/components/history/SessionList';
import { formatRelativeTime, formatPercentage } from '@/utils/course';
import { formatSessionDateTime } from '@/utils/date';
import { formatDuration, formatDurationShort } from '@/utils/time';

interface CourseStatsDialogProps {
  courseName: string;
  stats: CourseStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseStatsDialog({
  courseName,
  stats,
  open,
  onOpenChange,
}: CourseStatsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Estatísticas — {courseName}</DialogTitle>
          <DialogDescription>Progresso e histórico de sessões do curso.</DialogDescription>
        </DialogHeader>

        {stats && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Horas estudadas</p>
                <p className="text-lg font-semibold">{formatDuration(stats.studiedSeconds)}</p>
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Percentual concluído</p>
                <p className="text-lg font-semibold">
                  {formatPercentage(stats.completionPercentage)}
                </p>
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Tempo médio por sessão</p>
                <p className="text-lg font-semibold">
                  {formatDurationShort(stats.averageSessionSeconds)}
                </p>
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs">Total de sessões</p>
                <p className="text-lg font-semibold">{stats.sessionsCount}</p>
              </div>
            </div>

            {stats.completionPercentage > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Progresso</p>
                <Progress value={stats.completionPercentage} />
              </div>
            )}

            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Última sessão: </span>
                {stats.lastSessionAt
                  ? formatSessionDateTime(stats.lastSessionAt)
                  : 'Nenhuma sessão registrada'}
              </p>
              <p>
                <span className="text-muted-foreground">Tempo desde última atividade: </span>
                {stats.timeSinceLastActivityMs !== null
                  ? formatRelativeTime(stats.timeSinceLastActivityMs)
                  : '—'}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Histórico de sessões</p>
              {stats.sessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma sessão vinculada a este curso.
                </p>
              ) : (
                <SessionList sessions={stats.sessions} readOnly />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
