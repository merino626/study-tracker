export const IPC_CHANNELS = {
  SESSION_CREATE: 'session:create',
  SESSION_UPDATE: 'session:update',
  SESSION_DELETE: 'session:delete',
  SESSION_LIST: 'session:list',

  STATS_GET: 'stats:get',

  COURSE_CREATE: 'course:create',
  COURSE_UPDATE: 'course:update',
  COURSE_DELETE: 'course:delete',
  COURSE_LIST: 'course:list',
  COURSE_GET: 'course:get',
  COURSE_STATS: 'course:stats',

  COURSE_NOTE_LIST: 'course-note:list',
  COURSE_NOTE_CREATE: 'course-note:create',
  COURSE_NOTE_UPDATE: 'course-note:update',
  COURSE_NOTE_DELETE: 'course-note:delete',

  COURSE_ATTACHMENT_LIST: 'course-attachment:list',
  COURSE_ATTACHMENT_ADD: 'course-attachment:add',
  COURSE_ATTACHMENT_DELETE: 'course-attachment:delete',
  COURSE_ATTACHMENT_READ: 'course-attachment:read',
  COURSE_ATTACHMENT_OPEN: 'course-attachment:open',

  BACKUP_CREATE: 'backup:create',
  BACKUP_LIST: 'backup:list',
  BACKUP_VALIDATE: 'backup:validate',
  BACKUP_PREVIEW: 'backup:preview',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_PICK_FILE: 'backup:pick-file',

  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_PICK_BACKUP_FOLDER: 'settings:pick-backup-folder',

  WINDOW_ENTER_COMPACT: 'window:enter-compact',
  WINDOW_EXIT_COMPACT: 'window:exit-compact',
  WINDOW_SET_ALWAYS_ON_TOP: 'window:set-always-on-top',
  WINDOW_GET_COMPACT_MODE: 'window:get-compact-mode',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
