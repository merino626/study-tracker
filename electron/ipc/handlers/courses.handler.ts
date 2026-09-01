import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../../shared/types/ipc-channels';
import type {
  Course,
  CourseDetail,
  CourseStats,
  CreateCourseInput,
  UpdateCourseInput,
} from '../../../shared/types/models';
import type { CoursePriority, CourseStatus } from '../../../shared/constants/courses';
import { courseIdSchema, createCourseSchema, updateCourseSchema } from '../../../shared/schemas';
import { deleteCourseAttachmentFolder } from '../../main/attachments';
import { getPrismaClient } from '../../main/database';
import { validateInput, wrapIpcHandler } from '../validate';

function parseTags(tags: string): string[] {
  try {
    const parsed: unknown = JSON.parse(tags);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : [];
  } catch {
    return [];
  }
}

async function getStudiedSecondsByCourse(courseIds: string[]): Promise<Map<string, number>> {
  const prisma = getPrismaClient();
  if (courseIds.length === 0) {
    return new Map();
  }

  const aggregates = await prisma.studySession.groupBy({
    by: ['courseId'],
    _sum: { durationSeconds: true },
    where: { courseId: { in: courseIds } },
  });

  return new Map(
    aggregates
      .filter((item) => item.courseId !== null)
      .map((item) => [item.courseId as string, item._sum.durationSeconds ?? 0]),
  );
}

function mapCourse(
  course: {
    id: string;
    name: string;
    platform: string;
    url: string | null;
    instructor: string | null;
    category: string | null;
    officialHours: number | null;
    startedAt: Date | null;
    completedAt: Date | null;
    status: string;
    priority: string;
    rating: number | null;
    notes: string;
    tags: string;
    createdAt: Date;
    updatedAt: Date;
  },
  studiedSeconds: number,
): Course {
  return {
    id: course.id,
    name: course.name,
    platform: course.platform,
    url: course.url,
    instructor: course.instructor,
    category: course.category,
    officialHours: course.officialHours,
    startedAt: course.startedAt?.toISOString() ?? null,
    completedAt: course.completedAt?.toISOString() ?? null,
    status: course.status as CourseStatus,
    priority: course.priority as CoursePriority,
    rating: course.rating,
    notes: course.notes,
    tags: parseTags(course.tags),
    studiedSeconds,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}

function buildCourseData(input: CreateCourseInput | UpdateCourseInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.platform !== undefined && { platform: input.platform }),
    ...(input.url !== undefined && { url: input.url || null }),
    ...(input.instructor !== undefined && { instructor: input.instructor }),
    ...(input.category !== undefined && { category: input.category }),
    ...(input.officialHours !== undefined && { officialHours: input.officialHours }),
    ...(input.startedAt !== undefined && {
      startedAt: input.startedAt ? new Date(input.startedAt) : null,
    }),
    ...(input.completedAt !== undefined && {
      completedAt: input.completedAt ? new Date(input.completedAt) : null,
    }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.rating !== undefined && { rating: input.rating }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.tags !== undefined && { tags: JSON.stringify(input.tags) }),
  };
}

export function registerCourseHandlers(): void {
  const prisma = getPrismaClient();

  ipcMain.handle(
    IPC_CHANNELS.COURSE_CREATE,
    wrapIpcHandler(async (_event, data: unknown) => {
      const validated = validateInput(createCourseSchema, data);
      const course = await prisma.course.create({
        data: buildCourseData(validated),
      });
      return mapCourse(course, 0);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_UPDATE,
    wrapIpcHandler(async (_event, id: unknown, data: unknown) => {
      const validatedId = validateInput(courseIdSchema, id);
      const validated = validateInput(updateCourseSchema, data);
      const course = await prisma.course.update({
        where: { id: validatedId },
        data: buildCourseData(validated),
      });
      const studiedMap = await getStudiedSecondsByCourse([course.id]);
      return mapCourse(course, studiedMap.get(course.id) ?? 0);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_DELETE,
    wrapIpcHandler(async (_event, id: unknown) => {
      const validatedId = validateInput(courseIdSchema, id);
      await prisma.course.delete({ where: { id: validatedId } });
      deleteCourseAttachmentFolder(validatedId);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_LIST,
    wrapIpcHandler(async () => {
      const courses = await prisma.course.findMany({ orderBy: { updatedAt: 'desc' } });
      const studiedMap = await getStudiedSecondsByCourse(courses.map((course) => course.id));
      return courses.map((course) => mapCourse(course, studiedMap.get(course.id) ?? 0));
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_GET,
    wrapIpcHandler(async (_event, id: unknown): Promise<CourseDetail> => {
      const validatedId = validateInput(courseIdSchema, id);
      const [course, notesCount, attachmentsCount, studiedMap] = await Promise.all([
        prisma.course.findUniqueOrThrow({ where: { id: validatedId } }),
        prisma.courseNote.count({ where: { courseId: validatedId } }),
        prisma.courseAttachment.count({ where: { courseId: validatedId } }),
        getStudiedSecondsByCourse([validatedId]),
      ]);

      return {
        ...mapCourse(course, studiedMap.get(course.id) ?? 0),
        notesCount,
        attachmentsCount,
      };
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_STATS,
    wrapIpcHandler(async (_event, id: unknown): Promise<CourseStats> => {
      const validatedId = validateInput(courseIdSchema, id);
      const [course, sessions] = await Promise.all([
        prisma.course.findUniqueOrThrow({ where: { id: validatedId } }),
        prisma.studySession.findMany({
          where: { courseId: validatedId },
          orderBy: { startedAt: 'desc' },
        }),
      ]);

      const studiedSeconds = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
      const sessionsCount = sessions.length;
      const averageSessionSeconds =
        sessionsCount > 0 ? Math.round(studiedSeconds / sessionsCount) : 0;
      const lastSession = sessions[0] ?? null;
      const completionPercentage =
        course.officialHours && course.officialHours > 0
          ? Math.min(100, (studiedSeconds / 3600 / course.officialHours) * 100)
          : 0;

      return {
        courseId: course.id,
        studiedSeconds,
        completionPercentage,
        averageSessionSeconds,
        sessionsCount,
        lastSessionAt: lastSession?.endedAt.toISOString() ?? null,
        timeSinceLastActivityMs: lastSession ? Date.now() - lastSession.endedAt.getTime() : null,
        sessions: sessions.map((session) => ({
          id: session.id,
          startedAt: session.startedAt.toISOString(),
          endedAt: session.endedAt.toISOString(),
          durationSeconds: session.durationSeconds,
          courseId: session.courseId,
          createdAt: session.createdAt.toISOString(),
        })),
      };
    }),
  );
}
