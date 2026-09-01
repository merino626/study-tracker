import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WeeklyGoalProgressProps {
  targetHours: number;
  completedHours: number;
  remainingHours: number;
  percentage: number;
}

export function WeeklyGoalProgress({
  targetHours,
  completedHours,
  remainingHours,
  percentage,
}: WeeklyGoalProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meta semanal</CardTitle>
        <CardDescription>
          {completedHours.toFixed(1)}h de {targetHours}h — faltam {remainingHours.toFixed(1)}h
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percentage} />
        <p className="text-muted-foreground text-sm">{percentage.toFixed(0)}% concluído</p>
      </CardContent>
    </Card>
  );
}
