import { useCallback } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { WeeklyGoalProgress } from '@/components/dashboard/WeeklyGoalProgress';
import { PageState } from '@/components/layout/PageState';
import { TimerCard } from '@/components/timer/TimerCard';
import { useStats } from '@/hooks/useStats';

export function DashboardPage() {
  const { stats, loading, error, refetch } = useStats();

  const handleSessionSaved = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Acompanhe seu progresso e inicie uma sessão de estudo.
        </p>
      </div>

      <TimerCard onSessionSaved={handleSessionSaved} />

      <PageState loading={loading} error={error}>
        {stats && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Hoje" valueSeconds={stats.today} />
              <StatsCard title="Esta semana" valueSeconds={stats.thisWeek} />
              <StatsCard title="Este mês" valueSeconds={stats.thisMonth} />
              <StatsCard title="Total" valueSeconds={stats.total} />
            </div>

            <WeeklyGoalProgress
              targetHours={stats.weeklyGoal.targetHours}
              completedHours={stats.weeklyGoal.completedHours}
              remainingHours={stats.weeklyGoal.remainingHours}
              percentage={stats.weeklyGoal.percentage}
            />
          </>
        )}
      </PageState>
    </div>
  );
}
