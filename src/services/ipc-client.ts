import type { StudyTrackerApi } from '@shared/types/models';

function getApi(): StudyTrackerApi {
  if (!window.api) {
    throw new Error('Electron API not available. Run inside the desktop app.');
  }
  return window.api;
}

export const ipcClient = {
  sessions: {
    create: (data: Parameters<StudyTrackerApi['sessions']['create']>[0]) =>
      getApi().sessions.create(data),
    update: (id: string, data: Parameters<StudyTrackerApi['sessions']['update']>[1]) =>
      getApi().sessions.update(id, data),
    delete: (id: string) => getApi().sessions.delete(id),
    list: () => getApi().sessions.list(),
  },
  stats: {
    get: () => getApi().stats.get(),
  },
  courses: {
    create: (data: Parameters<StudyTrackerApi['courses']['create']>[0]) =>
      getApi().courses.create(data),
    update: (id: string, data: Parameters<StudyTrackerApi['courses']['update']>[1]) =>
      getApi().courses.update(id, data),
    delete: (id: string) => getApi().courses.delete(id),
    list: () => getApi().courses.list(),
    get: (id: string) => getApi().courses.get(id),
    stats: (id: string) => getApi().courses.stats(id),
  },
  courseNotes: {
    list: (courseId: string) => getApi().courseNotes.list(courseId),
    create: (data: Parameters<StudyTrackerApi['courseNotes']['create']>[0]) =>
      getApi().courseNotes.create(data),
    update: (id: string, data: Parameters<StudyTrackerApi['courseNotes']['update']>[1]) =>
      getApi().courseNotes.update(id, data),
    delete: (id: string) => getApi().courseNotes.delete(id),
  },
  courseAttachments: {
    list: (courseId: string, noteId?: string | null) =>
      getApi().courseAttachments.list(courseId, noteId),
    add: (courseId: string, noteId?: string | null) =>
      getApi().courseAttachments.add(courseId, noteId),
    delete: (attachmentId: string) => getApi().courseAttachments.delete(attachmentId),
    read: (attachmentId: string) => getApi().courseAttachments.read(attachmentId),
    open: (attachmentId: string) => getApi().courseAttachments.open(attachmentId),
  },
  backup: {
    create: () => getApi().backup.create(),
    list: () => getApi().backup.list(),
    validate: (filePath: string) => getApi().backup.validate(filePath),
    preview: (filePath: string) => getApi().backup.preview(filePath),
    restore: (input: Parameters<StudyTrackerApi['backup']['restore']>[0]) =>
      getApi().backup.restore(input),
    pickFile: () => getApi().backup.pickFile(),
  },
  settings: {
    get: () => getApi().settings.get(),
    update: (data: Parameters<StudyTrackerApi['settings']['update']>[0]) =>
      getApi().settings.update(data),
    pickBackupFolder: () => getApi().settings.pickBackupFolder(),
  },
  window: {
    enterCompact: () => getApi().window.enterCompact(),
    exitCompact: () => getApi().window.exitCompact(),
    setAlwaysOnTop: (value: boolean) => getApi().window.setAlwaysOnTop(value),
    getCompactMode: () => getApi().window.getCompactMode(),
  },
};
