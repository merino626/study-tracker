import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PeriodBarItem } from '@/utils/stats';
import { formatDurationShort } from '@/utils/time';

interface PeriodBreakdownProps {
  periods: PeriodBarItem[];
}

export function PeriodBreakdown({ periods }: PeriodBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição por período</CardTitle>
        <CardDescription>Comparativo relativo do tempo estudado em cada período.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {periods.map((period) => (
          <div key={period.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{period.label}</span>
              <span className="font-medium tabular-nums">
                {formatDurationShort(period.valueSeconds)}
              </span>
            </div>
            <Progress value={period.percentage} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
