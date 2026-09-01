export const COURSE_STATUSES = ['not_started', 'in_progress', 'completed', 'paused'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_PRIORITIES = ['low', 'medium', 'high'] as const;
export type CoursePriority = (typeof COURSE_PRIORITIES)[number];

export const COURSE_PLATFORMS = [
  'Udemy',
  'Alura',
  'Coursera',
  'YouTube',
  'LinkedIn Learning',
  'Pluralsight',
  'Domestika',
  'Outro',
] as const;

export const BACKUP_MODULES = ['sessions', 'courses', 'settings'] as const;
export type BackupModule = (typeof BACKUP_MODULES)[number];

export const BACKUP_FORMAT_VERSION = '1.1.0';
export const MAX_BACKUP_VERSIONS = 50;
export const BACKUP_FILE_PREFIX = 'backup';
