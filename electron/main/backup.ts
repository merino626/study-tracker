import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import type { PrismaClient } from '@prisma/client';
import {
  BACKUP_FILE_PREFIX,
  BACKUP_FORMAT_VERSION,
  BACKUP_MODULES,
  MAX_BACKUP_VERSIONS,
  type BackupModule,
  type CoursePriority,
  type CourseStatus,
} from '../../shared/constants/courses';
import {
  ATTACHMENTS_ZIP_PREFIX,
  listAllAttachmentFiles,
  resolveAttachmentsRoot,
  restoreAttachmentFile,
} from './attachments';
import type {
  AppSettings,
  BackupFileInfo,
  BackupPreview,
  BackupValidationResult,
  Course,
  CourseAttachment,
  CourseNote,
  StudySession,
} from '../../shared/types/models';

const BACKUP_ENTRIES = {
  MANIFEST: 'manifest.json',
  SESSIONS: 'sessions.json',
  COURSES: 'courses.json',
  COURSE_NOTES: 'course-notes.json',
  COURSE_ATTACHMENTS: 'course-attachments.json',
  SETTINGS: 'settings.json',
  CATEGORIES: 'categories.json',
} as const;

interface BackupManifest {
  formatVersion: string;
  createdAt: string;
  appVersion: string;
  checksums: Record<string, string>;
  counts: Record<string, number>;
}

interface BackupData {
  manifest: BackupManifest;
  sessions: StudySession[];
  courses: Course[];
  courseNotes: CourseNote[];
  courseAttachments: CourseAttachment[];
  settings: AppSettings | null;
  categories: string[];
  attachmentFiles: Array<{ storageKey: string; absolutePath: string }>;
}

class BackupFolderNotConfiguredError extends Error {
  constructor() {
    super('Configure uma pasta de backup nas configurações antes de continuar.');
    this.name = 'BackupFolderNotConfiguredError';
  }
}

class BackupFileInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupFileInvalidError';
  }
}

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

function mapSettings(settings: {
  id: string;
  weeklyGoalHours: number;
  theme: string;
  alwaysOnTop: boolean;
  launchOnStartup: boolean;
  backupFolderPath: string | null;
  backupOnQuit: boolean;
  autoBackupDaily: boolean;
  lastAutoBackupAt: Date | null;
  updatedAt: Date;
}): AppSettings {
  return {
    id: settings.id,
    weeklyGoalHours: settings.weeklyGoalHours,
    theme: settings.theme as AppSettings['theme'],
    alwaysOnTop: settings.alwaysOnTop,
    launchOnStartup: settings.launchOnStartup,
    backupFolderPath: settings.backupFolderPath,
    backupOnQuit: settings.backupOnQuit,
    autoBackupDaily: settings.autoBackupDaily,
    lastAutoBackupAt: settings.lastAutoBackupAt?.toISOString() ?? null,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function formatBackupFileName(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${BACKUP_FILE_PREFIX}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}.zip`;
}

async function collectBackupData(client: PrismaClient): Promise<BackupData> {
  const [sessions, courses, courseNotes, courseAttachments, settings, sessionAggregates] =
    await Promise.all([
      client.studySession.findMany({ orderBy: { startedAt: 'desc' } }),
      client.course.findMany({ orderBy: { updatedAt: 'desc' } }),
      client.courseNote.findMany({ orderBy: { updatedAt: 'desc' } }),
      client.courseAttachment.findMany({ orderBy: { createdAt: 'desc' } }),
      client.appSettings.findUnique({ where: { id: 'default' } }),
      client.studySession.groupBy({
        by: ['courseId'],
        _sum: { durationSeconds: true },
        where: { courseId: { not: null } },
      }),
    ]);

  const studiedByCourse = new Map(
    sessionAggregates
      .filter((item) => item.courseId !== null)
      .map((item) => [item.courseId as string, item._sum.durationSeconds ?? 0]),
  );

  const mappedCourses = courses.map((course) =>
    mapCourse(course, studiedByCourse.get(course.id) ?? 0),
  );

  const categories = [
    ...new Set(
      mappedCourses
        .map((course) => course.category)
        .filter((category): category is string => Boolean(category)),
    ),
  ].sort();

  const mappedSessions = sessions.map(mapSession);
  const mappedSettings = settings ? mapSettings(settings) : null;
  const mappedCourseNotes: CourseNote[] = courseNotes.map((note) => ({
    id: note.id,
    courseId: note.courseId,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }));
  const mappedCourseAttachments: CourseAttachment[] = courseAttachments.map((attachment) => ({
    id: attachment.id,
    courseId: attachment.courseId,
    noteId: attachment.noteId,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    storageKey: attachment.storageKey,
    createdAt: attachment.createdAt.toISOString(),
  }));
  const attachmentFiles = listAllAttachmentFiles();

  const fileContents: Record<string, string> = {
    [BACKUP_ENTRIES.SESSIONS]: JSON.stringify(mappedSessions, null, 2),
    [BACKUP_ENTRIES.COURSES]: JSON.stringify(mappedCourses, null, 2),
    [BACKUP_ENTRIES.COURSE_NOTES]: JSON.stringify(mappedCourseNotes, null, 2),
    [BACKUP_ENTRIES.COURSE_ATTACHMENTS]: JSON.stringify(mappedCourseAttachments, null, 2),
    [BACKUP_ENTRIES.SETTINGS]: JSON.stringify(mappedSettings, null, 2),
    [BACKUP_ENTRIES.CATEGORIES]: JSON.stringify(categories, null, 2),
  };

  const checksums = Object.fromEntries(
    Object.entries(fileContents).map(([name, content]) => [name, hashContent(content)]),
  );

  const manifest: BackupManifest = {
    formatVersion: BACKUP_FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    appVersion: process.env.npm_package_version ?? '1.0.0',
    checksums,
    counts: {
      sessions: mappedSessions.length,
      courses: mappedCourses.length,
      courseNotes: mappedCourseNotes.length,
      courseAttachments: mappedCourseAttachments.length,
      attachmentFiles: attachmentFiles.length,
      settings: mappedSettings ? 1 : 0,
      categories: categories.length,
    },
  };

  return {
    manifest,
    sessions: mappedSessions,
    courses: mappedCourses,
    courseNotes: mappedCourseNotes,
    courseAttachments: mappedCourseAttachments,
    settings: mappedSettings,
    categories,
    attachmentFiles,
  };
}

function readZipEntry(zip: AdmZip, entryName: string): string | null {
  const entry = zip.getEntry(entryName);
  if (!entry) {
    return null;
  }
  return zip.readAsText(entry);
}

function parseBackupZip(filePath: string): BackupData {
  if (!fs.existsSync(filePath)) {
    throw new BackupFileInvalidError('Arquivo de backup não encontrado.');
  }

  const zip = new AdmZip(filePath);
  const manifestRaw = readZipEntry(zip, BACKUP_ENTRIES.MANIFEST);
  if (!manifestRaw) {
    throw new BackupFileInvalidError('Backup inválido: manifest.json ausente.');
  }

  const manifest = JSON.parse(manifestRaw) as BackupManifest;
  const errors: string[] = [];

  const sessionsRaw = readZipEntry(zip, BACKUP_ENTRIES.SESSIONS) ?? '[]';
  const coursesRaw = readZipEntry(zip, BACKUP_ENTRIES.COURSES) ?? '[]';
  const courseNotesRaw = readZipEntry(zip, BACKUP_ENTRIES.COURSE_NOTES) ?? '[]';
  const courseAttachmentsRaw = readZipEntry(zip, BACKUP_ENTRIES.COURSE_ATTACHMENTS) ?? '[]';
  const settingsRaw = readZipEntry(zip, BACKUP_ENTRIES.SETTINGS) ?? 'null';
  const categoriesRaw = readZipEntry(zip, BACKUP_ENTRIES.CATEGORIES) ?? '[]';

  const filesToValidate: Record<string, string> = {
    [BACKUP_ENTRIES.SESSIONS]: sessionsRaw,
    [BACKUP_ENTRIES.COURSES]: coursesRaw,
    [BACKUP_ENTRIES.SETTINGS]: settingsRaw,
    [BACKUP_ENTRIES.CATEGORIES]: categoriesRaw,
  };

  if (courseNotesRaw) {
    filesToValidate[BACKUP_ENTRIES.COURSE_NOTES] = courseNotesRaw;
  }
  if (courseAttachmentsRaw) {
    filesToValidate[BACKUP_ENTRIES.COURSE_ATTACHMENTS] = courseAttachmentsRaw;
  }

  for (const [fileName, content] of Object.entries(filesToValidate)) {
    const expected = manifest.checksums?.[fileName];
    if (expected && hashContent(content) !== expected) {
      errors.push(`Checksum inválido para ${fileName}.`);
    }
  }

  if (errors.length > 0) {
    throw new BackupFileInvalidError(errors.join(' '));
  }

  return {
    manifest,
    sessions: JSON.parse(sessionsRaw) as StudySession[],
    courses: JSON.parse(coursesRaw) as Course[],
    courseNotes: JSON.parse(courseNotesRaw) as CourseNote[],
    courseAttachments: JSON.parse(courseAttachmentsRaw) as CourseAttachment[],
    settings: JSON.parse(settingsRaw) as AppSettings | null,
    categories: JSON.parse(categoriesRaw) as string[],
    attachmentFiles: [],
  };
}

function pruneOldBackups(folderPath: string): void {
  const backups = listBackupFiles(folderPath);
  if (backups.length <= MAX_BACKUP_VERSIONS) {
    return;
  }

  const toDelete = backups.slice(MAX_BACKUP_VERSIONS);
  for (const backup of toDelete) {
    fs.unlinkSync(backup.filePath);
  }
}

export function listBackupFiles(folderPath: string): BackupFileInfo[] {
  if (!fs.existsSync(folderPath)) {
    return [];
  }

  return fs
    .readdirSync(folderPath)
    .filter((fileName) => fileName.startsWith(BACKUP_FILE_PREFIX) && fileName.endsWith('.zip'))
    .map((fileName) => {
      const filePath = path.join(folderPath, fileName);
      const stats = fs.statSync(filePath);
      return {
        filePath,
        fileName,
        createdAt: stats.mtime.toISOString(),
        sizeBytes: stats.size,
      };
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function resolveBackupFolder(client: PrismaClient): Promise<string> {
  const settings = await client.appSettings.findUnique({ where: { id: 'default' } });
  if (!settings?.backupFolderPath) {
    throw new BackupFolderNotConfiguredError();
  }

  if (!fs.existsSync(settings.backupFolderPath)) {
    fs.mkdirSync(settings.backupFolderPath, { recursive: true });
  }

  return settings.backupFolderPath;
}

export async function createBackup(
  client: PrismaClient,
  reason: 'manual' | 'auto' | 'quit' | 'migration' = 'manual',
): Promise<BackupFileInfo> {
  const folderPath = await resolveBackupFolder(client);
  const data = await collectBackupData(client);
  const fileName = formatBackupFileName(new Date());
  const filePath = path.join(folderPath, fileName);

  const zip = new AdmZip();
  zip.addFile(
    BACKUP_ENTRIES.MANIFEST,
    Buffer.from(JSON.stringify(data.manifest, null, 2), 'utf-8'),
  );
  zip.addFile(
    BACKUP_ENTRIES.SESSIONS,
    Buffer.from(JSON.stringify(data.sessions, null, 2), 'utf-8'),
  );
  zip.addFile(BACKUP_ENTRIES.COURSES, Buffer.from(JSON.stringify(data.courses, null, 2), 'utf-8'));
  zip.addFile(
    BACKUP_ENTRIES.COURSE_NOTES,
    Buffer.from(JSON.stringify(data.courseNotes, null, 2), 'utf-8'),
  );
  zip.addFile(
    BACKUP_ENTRIES.COURSE_ATTACHMENTS,
    Buffer.from(JSON.stringify(data.courseAttachments, null, 2), 'utf-8'),
  );
  zip.addFile(
    BACKUP_ENTRIES.SETTINGS,
    Buffer.from(JSON.stringify(data.settings, null, 2), 'utf-8'),
  );
  zip.addFile(
    BACKUP_ENTRIES.CATEGORIES,
    Buffer.from(JSON.stringify(data.categories, null, 2), 'utf-8'),
  );

  for (const attachmentFile of data.attachmentFiles) {
    if (!fs.existsSync(attachmentFile.absolutePath)) {
      continue;
    }
    const zipPath = `${ATTACHMENTS_ZIP_PREFIX}${attachmentFile.storageKey.replace(/\\/g, '/')}`;
    zip.addFile(zipPath, fs.readFileSync(attachmentFile.absolutePath));
  }

  zip.writeZip(filePath);

  if (reason === 'auto') {
    await client.appSettings.update({
      where: { id: 'default' },
      data: { lastAutoBackupAt: new Date() },
    });
  }

  pruneOldBackups(folderPath);

  const stats = fs.statSync(filePath);
  return {
    filePath,
    fileName,
    createdAt: stats.mtime.toISOString(),
    sizeBytes: stats.size,
  };
}

export function validateBackupFile(filePath: string): BackupValidationResult {
  try {
    const data = parseBackupZip(filePath);
    return {
      valid: true,
      errors: [],
      formatVersion: data.manifest.formatVersion,
      createdAt: data.manifest.createdAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup inválido.';
    return {
      valid: false,
      errors: [message],
      formatVersion: null,
      createdAt: null,
    };
  }
}

export function previewBackupFile(filePath: string): BackupPreview {
  try {
    const data = parseBackupZip(filePath);
    return {
      valid: true,
      errors: [],
      formatVersion: data.manifest.formatVersion,
      createdAt: data.manifest.createdAt,
      counts: {
        sessions: data.sessions.length,
        courses: data.courses.length,
        courseNotes: data.courseNotes.length,
        courseAttachments: data.courseAttachments.length,
        settings: data.settings ? 1 : 0,
        categories: data.categories.length,
      },
      sample: {
        sessions: data.sessions.slice(0, 5),
        courses: data.courses.slice(0, 5),
        courseNotes: data.courseNotes.slice(0, 5),
        courseAttachments: data.courseAttachments.slice(0, 5),
        settings: data.settings,
        categories: data.categories.slice(0, 10),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup inválido.';
    return {
      valid: false,
      errors: [message],
      formatVersion: null,
      createdAt: null,
      counts: {
        sessions: 0,
        courses: 0,
        courseNotes: 0,
        courseAttachments: 0,
        settings: 0,
        categories: 0,
      },
      sample: {
        sessions: [],
        courses: [],
        courseNotes: [],
        courseAttachments: [],
        settings: null,
        categories: [],
      },
    };
  }
}

export async function restoreBackup(
  client: PrismaClient,
  filePath: string,
  modules: BackupModule[],
): Promise<void> {
  const zip = new AdmZip(filePath);
  const data = parseBackupZip(filePath);
  const selectedModules = new Set(modules);

  await client.$transaction(async (tx) => {
    if (selectedModules.has('sessions')) {
      await tx.studySession.deleteMany();
      if (data.sessions.length > 0) {
        await tx.studySession.createMany({
          data: data.sessions.map((session) => ({
            id: session.id,
            startedAt: new Date(session.startedAt),
            endedAt: new Date(session.endedAt),
            durationSeconds: session.durationSeconds,
            courseId: session.courseId,
            createdAt: new Date(session.createdAt),
          })),
        });
      }
    }

    if (selectedModules.has('courses')) {
      await tx.courseAttachment.deleteMany();
      await tx.courseNote.deleteMany();
      await tx.course.deleteMany();

      if (data.courses.length > 0) {
        await tx.course.createMany({
          data: data.courses.map((course) => ({
            id: course.id,
            name: course.name,
            platform: course.platform,
            url: course.url,
            instructor: course.instructor,
            category: course.category,
            officialHours: course.officialHours,
            startedAt: course.startedAt ? new Date(course.startedAt) : null,
            completedAt: course.completedAt ? new Date(course.completedAt) : null,
            status: course.status,
            priority: course.priority,
            rating: course.rating,
            notes: course.notes,
            tags: JSON.stringify(course.tags),
            createdAt: new Date(course.createdAt),
            updatedAt: new Date(course.updatedAt),
          })),
        });
      }

      if (data.courseNotes.length > 0) {
        await tx.courseNote.createMany({
          data: data.courseNotes.map((note) => ({
            id: note.id,
            courseId: note.courseId,
            title: note.title,
            content: note.content,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          })),
        });
      }

      if (data.courseAttachments.length > 0) {
        await tx.courseAttachment.createMany({
          data: data.courseAttachments.map((attachment) => ({
            id: attachment.id,
            courseId: attachment.courseId,
            noteId: attachment.noteId,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            storageKey: attachment.storageKey,
            createdAt: new Date(attachment.createdAt),
          })),
        });
      }
    }

    if (selectedModules.has('settings') && data.settings) {
      await tx.appSettings.upsert({
        where: { id: 'default' },
        update: {
          weeklyGoalHours: data.settings.weeklyGoalHours,
          theme: data.settings.theme,
          alwaysOnTop: data.settings.alwaysOnTop,
          launchOnStartup: data.settings.launchOnStartup,
          backupFolderPath: data.settings.backupFolderPath,
          backupOnQuit: data.settings.backupOnQuit,
          autoBackupDaily: data.settings.autoBackupDaily,
          lastAutoBackupAt: data.settings.lastAutoBackupAt
            ? new Date(data.settings.lastAutoBackupAt)
            : null,
          updatedAt: new Date(),
        },
        create: {
          id: 'default',
          weeklyGoalHours: data.settings.weeklyGoalHours,
          theme: data.settings.theme,
          alwaysOnTop: data.settings.alwaysOnTop,
          launchOnStartup: data.settings.launchOnStartup,
          backupFolderPath: data.settings.backupFolderPath,
          backupOnQuit: data.settings.backupOnQuit,
          autoBackupDaily: data.settings.autoBackupDaily,
          lastAutoBackupAt: data.settings.lastAutoBackupAt
            ? new Date(data.settings.lastAutoBackupAt)
            : null,
          updatedAt: new Date(),
        },
      });
    }
  });

  if (selectedModules.has('courses')) {
    const attachmentsRoot = resolveAttachmentsRoot();
    if (fs.existsSync(attachmentsRoot)) {
      fs.rmSync(attachmentsRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(attachmentsRoot, { recursive: true });

    for (const entry of zip.getEntries()) {
      if (!entry.entryName.startsWith(ATTACHMENTS_ZIP_PREFIX) || entry.isDirectory) {
        continue;
      }

      const storageKey = entry.entryName.slice(ATTACHMENTS_ZIP_PREFIX.length);
      restoreAttachmentFile(storageKey, entry.getData());
    }
  }
}

export async function runDailyBackupIfNeeded(client: PrismaClient): Promise<void> {
  const settings = await client.appSettings.findUnique({ where: { id: 'default' } });
  if (!settings?.autoBackupDaily || !settings.backupFolderPath) {
    return;
  }

  const now = new Date();
  const lastBackup = settings.lastAutoBackupAt;
  const shouldBackup = !lastBackup || now.getTime() - lastBackup.getTime() >= 24 * 60 * 60 * 1000;

  if (!shouldBackup) {
    return;
  }

  await createBackup(client, 'auto');
}

export function isValidBackupModule(value: string): value is BackupModule {
  return (BACKUP_MODULES as readonly string[]).includes(value);
}
