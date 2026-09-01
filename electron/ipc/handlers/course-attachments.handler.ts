import { dialog, ipcMain, shell } from 'electron';
import fs from 'node:fs';
import { IPC_CHANNELS } from '../../../shared/types/ipc-channels';
import type { CourseAttachment, CourseAttachmentContent } from '../../../shared/types/models';
import {
  courseAttachmentAddSchema,
  courseAttachmentIdSchema,
  courseAttachmentListSchema,
} from '../../../shared/schemas';
import {
  buildStorageKey,
  deleteAttachmentFile,
  readAttachmentAsDataUrl,
  resolveAttachmentFilePath,
  saveAttachmentFile,
} from '../../main/attachments';
import { getPrismaClient } from '../../main/database';
import { getMainWindow } from '../../windows/main-window';
import { validateInput, wrapIpcHandler } from '../validate';

function mapAttachment(attachment: {
  id: string;
  courseId: string;
  noteId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: Date;
}): CourseAttachment {
  return {
    id: attachment.id,
    courseId: attachment.courseId,
    noteId: attachment.noteId,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    storageKey: attachment.storageKey,
    createdAt: attachment.createdAt.toISOString(),
  };
}

export function registerCourseAttachmentHandlers(): void {
  const prisma = getPrismaClient();

  ipcMain.handle(
    IPC_CHANNELS.COURSE_ATTACHMENT_LIST,
    wrapIpcHandler(async (_event, params: unknown) => {
      const validated = validateInput(courseAttachmentListSchema, params);
      const attachments = await prisma.courseAttachment.findMany({
        where: {
          courseId: validated.courseId,
          ...(validated.noteId !== undefined && { noteId: validated.noteId }),
        },
        orderBy: { createdAt: 'desc' },
      });
      return attachments.map(mapAttachment);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_ATTACHMENT_ADD,
    wrapIpcHandler(async (_event, params: unknown) => {
      const validated = validateInput(courseAttachmentAddSchema, params);
      const mainWindow = getMainWindow();

      const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
        properties: ['openFile'],
        title: 'Anexar arquivo',
        filters: [
          { name: 'Todos os arquivos', extensions: ['*'] },
          { name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] },
          { name: 'Documentos', extensions: ['pdf', 'txt', 'md', 'doc', 'docx'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const [sourcePath] = result.filePaths;
      if (!sourcePath) {
        return null;
      }

      const draft = await prisma.courseAttachment.create({
        data: {
          courseId: validated.courseId,
          noteId: validated.noteId ?? null,
          fileName: sourcePath.split(/[/\\]/).pop() ?? 'arquivo',
          mimeType: 'application/octet-stream',
          sizeBytes: 0,
          storageKey: 'pending',
        },
      });

      const fileName = draft.fileName;
      const storageKey = buildStorageKey(validated.courseId, draft.id, fileName);

      saveAttachmentFile(sourcePath, storageKey);

      const stats = fs.statSync(resolveAttachmentFilePath(storageKey));
      const mimeType = guessMimeType(fileName);

      const attachment = await prisma.courseAttachment.update({
        where: { id: draft.id },
        data: {
          storageKey,
          sizeBytes: stats.size,
          mimeType,
        },
      });

      return mapAttachment(attachment);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_ATTACHMENT_DELETE,
    wrapIpcHandler(async (_event, params: unknown) => {
      const validated = validateInput(courseAttachmentIdSchema, params);
      const attachment = await prisma.courseAttachment.findUniqueOrThrow({
        where: { id: validated.attachmentId },
      });

      deleteAttachmentFile(attachment.storageKey);
      await prisma.courseAttachment.delete({ where: { id: attachment.id } });
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_ATTACHMENT_READ,
    wrapIpcHandler(async (_event, params: unknown): Promise<CourseAttachmentContent> => {
      const validated = validateInput(courseAttachmentIdSchema, params);
      const attachment = await prisma.courseAttachment.findUniqueOrThrow({
        where: { id: validated.attachmentId },
      });

      return {
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        dataUrl: readAttachmentAsDataUrl(attachment.storageKey, attachment.mimeType),
      };
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.COURSE_ATTACHMENT_OPEN,
    wrapIpcHandler(async (_event, params: unknown) => {
      const validated = validateInput(courseAttachmentIdSchema, params);
      const attachment = await prisma.courseAttachment.findUniqueOrThrow({
        where: { id: validated.attachmentId },
      });

      const filePath = resolveAttachmentFilePath(attachment.storageKey);
      await shell.openPath(filePath);
    }),
  );
}

function guessMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
  };
  return map[extension] ?? 'application/octet-stream';
}
