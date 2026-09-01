import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../../shared/types/ipc-channels';
import type { CourseNote } from '../../../shared/types/models';
import {
  courseNoteCourseIdSchema,
  courseNoteIdSchema,
  createCourseNoteSchema,
  updateCourseNoteSchema,
} from '../../../shared/schemas';
import { getPrismaClient } from '../../main/database';
import { validateInput, wrapIpcHandler } from '../validate';

function mapCourseNote(note: {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}): CourseNote {
  return {
    id: note.id,
    courseId: note.courseId,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function registerCourseNoteHandlers(): void {
  const prisma = getPrismaClient();

  ipcMain.handle(
    IPC_CHANNELS.COURSE_NOTE_LIST,
    wrapIpcHandler(async (_event, courseId: unknown) => {
      const validated = validateInput(courseNoteCourseIdSchema, { courseId });
      const notes = await prisma.courseNote.findMany({
        where: { courseId: validated.courseId },
        orderBy: { updatedAt: 'desc' },
      });
      return notes.map(mapCourseNote);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_NOTE_CREATE,
    wrapIpcHandler(async (_event, data: unknown) => {
      const validated = validateInput(createCourseNoteSchema, data);
      const note = await prisma.courseNote.create({
        data: {
          courseId: validated.courseId,
          title: validated.title,
          content: validated.content ?? '',
        },
      });
      return mapCourseNote(note);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_NOTE_UPDATE,
    wrapIpcHandler(async (_event, id: unknown, data: unknown) => {
      const validatedId = validateInput(courseNoteIdSchema, id);
      const validated = validateInput(updateCourseNoteSchema, data);
      const note = await prisma.courseNote.update({
        where: { id: validatedId },
        data: validated,
      });
      return mapCourseNote(note);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_NOTE_DELETE,
    wrapIpcHandler(async (_event, id: unknown) => {
      const validatedId = validateInput(courseNoteIdSchema, id);
      await prisma.courseNote.delete({ where: { id: validatedId } });
    }),
  );
}
