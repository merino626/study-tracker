import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDurationShort, formatHoursDecimal } from '@/utils/time';

interface StatisticsHeroProps {
  totalSeconds: number;
  sessionsCount: number;
}

export function StatisticsHero({ totalSeconds, sessionsCount }: StatisticsHeroProps) {
  return (
    <Card className="from-primary/5 border-primary/20 bg-gradient-to-br to-transparent">
      <CardHeader>
        <CardDescription>Tempo total estudado</CardDescription>
        <CardTitle className="text-4xl font-semibold tracking-tight tabular-nums">
          {formatDurationShort(totalSeconds)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Em horas</p>
          <p className="font-medium tabular-nums">{formatHoursDecimal(totalSeconds)}h</p>
        </div>
        <div>
          <p className="text-muted-foreground">Sessões registradas</p>
          <p className="font-medium tabular-nums">{sessionsCount}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatisticsEmptyStateProps {
  onNavigate?: () => void;
}

export function StatisticsEmptyState({ onNavigate }: StatisticsEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <BarChart3 className="text-muted-foreground size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Nenhum dado ainda</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Inicie uma sessão de estudo no Dashboard para ver suas estatísticas aqui.
          </p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="text-primary text-sm font-medium hover:underline"
          >
            Ir para o Dashboard
          </button>
        )}
      </CardContent>
    </Card>
  );
}
