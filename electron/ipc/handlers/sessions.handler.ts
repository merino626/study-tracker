import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../../shared/types/ipc-channels';
import type { StatsSummary, StudySession } from '../../../shared/types/models';
import { createSessionSchema, sessionIdSchema, updateSessionSchema } from '../../../shared/schemas';
import { DEFAULT_WEEKLY_GOAL_HOURS } from '../../../shared/constants';
import { getPrismaClient } from '../../main/database';
import { validateInput, wrapIpcHandler } from '../validate';

function mapSession(session: {
  id: string;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  courseId: string | null;
  createdAt: Date;
}): StudySession {
  return {
    id: session.id,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    durationSeconds: session.durationSeconds,
    courseId: session.courseId,
    createdAt: session.createdAt.toISOString(),
  };
}

export function registerSessionHandlers(): void {
  const prisma = getPrismaClient();

  ipcMain.handle(
    IPC_CHANNELS.SESSION_CREATE,
    wrapIpcHandler(async (_event, data: unknown) => {
      const validated = validateInput(createSessionSchema, data);
      const session = await prisma.studySession.create({
        data: {
          startedAt: new Date(validated.startedAt),
          endedAt: new Date(validated.endedAt),
          durationSeconds: validated.durationSeconds,
          courseId: validated.courseId ?? null,
        },
      });
      return mapSession(session);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.SESSION_UPDATE,
    wrapIpcHandler(async (_event, id: unknown, data: unknown) => {
      const validatedId = validateInput(sessionIdSchema, id);
      const validated = validateInput(updateSessionSchema, data);

      const session = await prisma.studySession.update({
        where: { id: validatedId },
        data: {
          ...(validated.startedAt !== undefined && { startedAt: new Date(validated.startedAt) }),
          ...(validated.endedAt !== undefined && { endedAt: new Date(validated.endedAt) }),
          ...(validated.durationSeconds !== undefined && {
            durationSeconds: validated.durationSeconds,
          }),
          ...(validated.courseId !== undefined && { courseId: validated.courseId }),
        },
      });
      return mapSession(session);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.SESSION_DELETE,
    wrapIpcHandler(async (_event, id: unknown) => {
      const validatedId = validateInput(sessionIdSchema, id);
      await prisma.studySession.delete({ where: { id: validatedId } });
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.SESSION_LIST,
    wrapIpcHandler(async () => {
      const sessions = await prisma.studySession.findMany({
        orderBy: { startedAt: 'desc' },
      });
      return sessions.map(mapSession);
    }),
  );
}

export function registerStatsHandlers(): void {
  const prisma = getPrismaClient();

  ipcMain.handle(
    IPC_CHANNELS.STATS_GET,
    wrapIpcHandler(async (): Promise<StatsSummary> => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const twelveWeeksAgo = new Date(startOfToday);
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

      const [
        today,
        thisWeek,
        thisMonth,
        thisYear,
        total,
        last30Days,
        last12Weeks,
        settings,
        sessionsCount,
        sessionsThisWeek,
        longestSession,
        monthSessions,
      ] = await Promise.all([
        prisma.studySession.aggregate({
          _sum: { durationSeconds: true },
          where: { startedAt: { gte: startOfToday } },
        }),
        prisma.studySession.aggregate({
          _sum: { durationSeconds: true },
          where: { startedAt: { gte: startOfWeek } },
        }),
        prisma.studySession.aggregate({
          _sum: { durationSeconds: true },
          where: { startedAt: { gte: startOfMonth } },
        }),
        prisma.studySession.aggregate({
          _sum: { durationSeconds: true },
          where: { startedAt: { gte: startOfYear } },
        }),
        prisma.studySession.aggregate({
          _sum: { durationSeconds: true },
        }),
        prisma.studySession.aggregate({
          _sum: { durationSeconds: true },
          where: { startedAt: { gte: thirtyDaysAgo } },
        }),
        prisma.studySession.aggregate({
          _sum: { durationSeconds: true },
          where: { startedAt: { gte: twelveWeeksAgo } },
        }),
        prisma.appSettings.findUnique({ where: { id: 'default' } }),
        prisma.studySession.count(),
        prisma.studySession.count({ where: { startedAt: { gte: startOfWeek } } }),
        prisma.studySession.aggregate({ _max: { durationSeconds: true } }),
        prisma.studySession.findMany({
          where: { startedAt: { gte: startOfMonth } },
          select: { startedAt: true },
        }),
      ]);

      const uniqueStudyDays = new Set(
        monthSessions.map((session) => session.startedAt.toISOString().slice(0, 10)),
      );

      const todaySeconds = today._sum.durationSeconds ?? 0;
      const weekSeconds = thisWeek._sum.durationSeconds ?? 0;
      const targetHours = settings?.weeklyGoalHours ?? DEFAULT_WEEKLY_GOAL_HOURS;
      const completedHours = weekSeconds / 3600;
      const remainingHours = Math.max(0, targetHours - completedHours);
      const percentage = targetHours > 0 ? Math.min(100, (completedHours / targetHours) * 100) : 0;

      return {
        today: todaySeconds,
        thisWeek: weekSeconds,
        thisMonth: thisMonth._sum.durationSeconds ?? 0,
        thisYear: thisYear._sum.durationSeconds ?? 0,
        total: total._sum.durationSeconds ?? 0,
        dailyAvg: Math.round((last30Days._sum.durationSeconds ?? 0) / 30),
        weeklyAvg: Math.round((last12Weeks._sum.durationSeconds ?? 0) / 12),
        sessionsCount,
        sessionsThisWeek,
        longestSessionSeconds: longestSession._max.durationSeconds ?? 0,
        daysStudiedThisMonth: uniqueStudyDays.size,
        weeklyGoal: {
          targetHours,
          completedHours,
          remainingHours,
          percentage,
        },
      };
    }),
  );
}
