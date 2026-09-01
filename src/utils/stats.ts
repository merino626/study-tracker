export interface PeriodBarItem {
  label: string;
  valueSeconds: number;
  percentage: number;
}

export function buildPeriodBreakdown(stats: {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
}): PeriodBarItem[] {
  const periods = [
    { label: 'Hoje', valueSeconds: stats.today },
    { label: 'Esta semana', valueSeconds: stats.thisWeek },
    { label: 'Este mês', valueSeconds: stats.thisMonth },
    { label: 'Este ano', valueSeconds: stats.thisYear },
  ];

  const maxValue = Math.max(...periods.map((period) => period.valueSeconds), 1);

  return periods.map((period) => ({
    ...period,
    percentage: Math.round((period.valueSeconds / maxValue) * 100),
  }));
}

export function hasStudyData(totalSeconds: number, sessionsCount: number): boolean {
  return totalSeconds > 0 || sessionsCount > 0;
}
