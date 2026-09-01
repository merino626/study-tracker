import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Flame, ListChecks } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { WeeklyGoalProgress } from '@/components/dashboard/WeeklyGoalProgress';
import { InsightCard } from '@/components/statistics/InsightCard';
import { PeriodBreakdown } from '@/components/statistics/PeriodBreakdown';
import { StatisticsEmptyState, StatisticsHero } from '@/components/statistics/StatisticsHero';
import { PageState } from '@/components/layout/PageState';
import { useStats } from '@/hooks/useStats';
import { buildPeriodBreakdown, hasStudyData } from '@/utils/stats';
import { formatDurationShort } from '@/utils/time';

export function StatisticsPage() {
  const navigate = useNavigate();
  const { stats, loading, error } = useStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estatísticas</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Visão geral do seu desempenho ao longo do tempo.
        </p>
      </div>

      <PageState loading={loading} error={error}>
        {stats && !hasStudyData(stats.total, stats.sessionsCount) && (
          <StatisticsEmptyState onNavigate={() => navigate('/')} />
        )}

        {stats && hasStudyData(stats.total, stats.sessionsCount) && (
          <div className="space-y-6">
            <StatisticsHero totalSeconds={stats.total} sessionsCount={stats.sessionsCount} />

            <WeeklyGoalProgress
              targetHours={stats.weeklyGoal.targetHours}
              completedHours={stats.weeklyGoal.completedHours}
              remainingHours={stats.weeklyGoal.remainingHours}
              percentage={stats.weeklyGoal.percentage}
            />

            <div className="space-y-3">
              <h2 className="text-sm font-medium">Por período</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Hoje" valueSeconds={stats.today} />
                <StatsCard title="Esta semana" valueSeconds={stats.thisWeek} />
                <StatsCard title="Este mês" valueSeconds={stats.thisMonth} />
                <StatsCard title="Este ano" valueSeconds={stats.thisYear} />
              </div>
            </div>

            <PeriodBreakdown periods={buildPeriodBreakdown(stats)} />

            <div className="space-y-3">
              <h2 className="text-sm font-medium">Destaques</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InsightCard
                  title="Maior sessão"
                  description="Sua sessão mais longa registrada"
                  value={formatDurationShort(stats.longestSessionSeconds)}
                  icon={Flame}
                />
                <InsightCard
                  title="Dias estudados"
                  description="Dias com ao menos uma sessão neste mês"
                  value={String(stats.daysStudiedThisMonth)}
                  icon={CalendarDays}
                />
                <InsightCard
                  title="Sessões na semana"
                  description="Total de sessões registradas esta semana"
                  value={String(stats.sessionsThisWeek)}
                  icon={ListChecks}
                />
                <InsightCard
                  title="Média diária"
                  description="Média dos últimos 30 dias"
                  value={formatDurationShort(stats.dailyAvg)}
                  icon={Clock}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-medium">Médias</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatsCard
                  title="Média diária"
                  description="Últimos 30 dias"
                  valueSeconds={stats.dailyAvg}
                />
                <StatsCard
                  title="Média semanal"
                  description="Últimas 12 semanas"
                  valueSeconds={stats.weeklyAvg}
                />
              </div>
            </div>
          </div>
        )}
      </PageState>
    </div>
  );
}
