import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc-channels';
import type {
  CreateCourseInput,
  CreateCourseNoteInput,
  CreateSessionInput,
  RestoreBackupInput,
  StudyTrackerApi,
  UpdateCourseInput,
  UpdateCourseNoteInput,
  UpdateSessionInput,
  UpdateSettingsInput,
} from '../../shared/types/models';

const api: StudyTrackerApi = {
  sessions: {
    create: (data: CreateSessionInput) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE, data),
    update: (id: string, data: UpdateSessionInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_DELETE, id),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST),
  },
  stats: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.STATS_GET),
  },
  courses: {
    create: (data: CreateCourseInput) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_CREATE, data),
    update: (id: string, data: UpdateCourseInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.COURSE_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_DELETE, id),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.COURSE_LIST),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_GET, id),
    stats: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_STATS, id),
  },
  courseNotes: {
    list: (courseId: string) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_NOTE_LIST, courseId),
    create: (data: CreateCourseNoteInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.COURSE_NOTE_CREATE, data),
    update: (id: string, data: UpdateCourseNoteInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.COURSE_NOTE_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.COURSE_NOTE_DELETE, id),
  },
  courseAttachments: {
    list: (courseId: string, noteId?: string | null) =>
      ipcRenderer.invoke(IPC_CHANNELS.COURSE_ATTACHMENT_LIST, { courseId, noteId }),
    add: (courseId: string, noteId?: string | null) =>
      ipcRenderer.invoke(IPC_CHANNELS.COURSE_ATTACHMENT_ADD, { courseId, noteId }),
    delete: (attachmentId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.COURSE_ATTACHMENT_DELETE, { attachmentId }),
    read: (attachmentId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.COURSE_ATTACHMENT_READ, { attachmentId }),
    open: (attachmentId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.COURSE_ATTACHMENT_OPEN, { attachmentId }),
  },
  backup: {
    create: () => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CREATE),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_LIST),
    validate: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_VALIDATE, filePath),
    preview: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_PREVIEW, filePath),
    restore: (input: RestoreBackupInput) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_RESTORE, input),
    pickFile: () => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_PICK_FILE),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (data: UpdateSettingsInput) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, data),
    pickBackupFolder: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_PICK_BACKUP_FOLDER),
  },
  window: {
    enterCompact: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_ENTER_COMPACT),
    exitCompact: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_EXIT_COMPACT),
    setAlwaysOnTop: (value: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_ALWAYS_ON_TOP, value),
    getCompactMode: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_GET_COMPACT_MODE),
  },
};

contextBridge.exposeInMainWorld('api', api);
