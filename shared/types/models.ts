import type { BackupModule, CoursePriority, CourseStatus } from '../constants/courses';

export interface StudySession {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  courseId: string | null;
  createdAt: string;
}

export interface CreateSessionInput {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  courseId?: string | null;
}

export interface UpdateSessionInput {
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  courseId?: string | null;
}

export interface Course {
  id: string;
  name: string;
  platform: string;
  url: string | null;
  instructor: string | null;
  category: string | null;
  officialHours: number | null;
  startedAt: string | null;
  completedAt: string | null;
  status: CourseStatus;
  priority: CoursePriority;
  rating: number | null;
  notes: string;
  tags: string[];
  studiedSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  name: string;
  platform: string;
  url?: string | null;
  instructor?: string | null;
  category?: string | null;
  officialHours?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  status?: CourseStatus;
  priority?: CoursePriority;
  rating?: number | null;
  notes?: string;
  tags?: string[];
}

export interface UpdateCourseInput {
  name?: string;
  platform?: string;
  url?: string | null;
  instructor?: string | null;
  category?: string | null;
  officialHours?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  status?: CourseStatus;
  priority?: CoursePriority;
  rating?: number | null;
  notes?: string;
  tags?: string[];
}

export interface CourseStats {
  courseId: string;
  studiedSeconds: number;
  completionPercentage: number;
  averageSessionSeconds: number;
  sessionsCount: number;
  lastSessionAt: string | null;
  timeSinceLastActivityMs: number | null;
  sessions: StudySession[];
}

export interface CourseNote {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseNoteInput {
  courseId: string;
  title: string;
  content?: string;
}

export interface UpdateCourseNoteInput {
  title?: string;
  content?: string;
}

export interface CourseAttachment {
  id: string;
  courseId: string;
  noteId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: string;
}

export interface CourseAttachmentContent {
  id: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
}

export interface CourseDetail extends Course {
  notesCount: number;
  attachmentsCount: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  id: string;
  weeklyGoalHours: number;
  theme: ThemeMode;
  alwaysOnTop: boolean;
  launchOnStartup: boolean;
  backupFolderPath: string | null;
  backupOnQuit: boolean;
  autoBackupDaily: boolean;
  lastAutoBackupAt: string | null;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  weeklyGoalHours?: number;
  theme?: ThemeMode;
  alwaysOnTop?: boolean;
  launchOnStartup?: boolean;
  backupFolderPath?: string | null;
  backupOnQuit?: boolean;
  autoBackupDaily?: boolean;
}

export interface StatsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  total: number;
  dailyAvg: number;
  weeklyAvg: number;
  sessionsCount: number;
  sessionsThisWeek: number;
  longestSessionSeconds: number;
  daysStudiedThisMonth: number;
  weeklyGoal: {
    targetHours: number;
    completedHours: number;
    remainingHours: number;
    percentage: number;
  };
}

export interface BackupFileInfo {
  filePath: string;
  fileName: string;
  createdAt: string;
  sizeBytes: number;
}

export interface BackupValidationResult {
  valid: boolean;
  errors: string[];
  formatVersion: string | null;
  createdAt: string | null;
}

export interface BackupPreview {
  valid: boolean;
  errors: string[];
  formatVersion: string | null;
  createdAt: string | null;
  counts: {
    sessions: number;
    courses: number;
    courseNotes: number;
    courseAttachments: number;
    settings: number;
    categories: number;
  };
  sample: {
    sessions: StudySession[];
    courses: Course[];
    courseNotes: CourseNote[];
    courseAttachments: CourseAttachment[];
    settings: AppSettings | null;
    categories: string[];
  };
}

export interface RestoreBackupInput {
  filePath: string;
  modules: BackupModule[];
}

export interface StudyTrackerApi {
  sessions: {
    create: (data: CreateSessionInput) => Promise<StudySession>;
    update: (id: string, data: UpdateSessionInput) => Promise<StudySession>;
    delete: (id: string) => Promise<void>;
    list: () => Promise<StudySession[]>;
  };
  stats: {
    get: () => Promise<StatsSummary>;
  };
  courses: {
    create: (data: CreateCourseInput) => Promise<Course>;
    update: (id: string, data: UpdateCourseInput) => Promise<Course>;
    delete: (id: string) => Promise<void>;
    list: () => Promise<Course[]>;
    get: (id: string) => Promise<CourseDetail>;
    stats: (id: string) => Promise<CourseStats>;
  };
  courseNotes: {
    list: (courseId: string) => Promise<CourseNote[]>;
    create: (data: CreateCourseNoteInput) => Promise<CourseNote>;
    update: (id: string, data: UpdateCourseNoteInput) => Promise<CourseNote>;
    delete: (id: string) => Promise<void>;
  };
  courseAttachments: {
    list: (courseId: string, noteId?: string | null) => Promise<CourseAttachment[]>;
    add: (courseId: string, noteId?: string | null) => Promise<CourseAttachment | null>;
    delete: (attachmentId: string) => Promise<void>;
    read: (attachmentId: string) => Promise<CourseAttachmentContent>;
    open: (attachmentId: string) => Promise<void>;
  };
  backup: {
    create: () => Promise<BackupFileInfo>;
    list: () => Promise<BackupFileInfo[]>;
    validate: (filePath: string) => Promise<BackupValidationResult>;
    preview: (filePath: string) => Promise<BackupPreview>;
    restore: (input: RestoreBackupInput) => Promise<void>;
    pickFile: () => Promise<string | null>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    update: (data: UpdateSettingsInput) => Promise<AppSettings>;
    pickBackupFolder: () => Promise<string | null>;
  };
  window: {
    enterCompact: () => Promise<void>;
    exitCompact: () => Promise<void>;
    setAlwaysOnTop: (value: boolean) => Promise<void>;
    getCompactMode: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    api: StudyTrackerApi;
  }
}

export {};
