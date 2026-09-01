import { registerBackupHandlers } from './handlers/backup.handler';
import { registerCourseAttachmentHandlers } from './handlers/course-attachments.handler';
import { registerCourseNoteHandlers } from './handlers/course-notes.handler';
import { registerCourseHandlers } from './handlers/courses.handler';
import { registerSessionHandlers, registerStatsHandlers } from './handlers/sessions.handler';
import { registerSettingsHandlers } from './handlers/settings.handler';
import { registerWindowHandlers } from './handlers/window.handler';

export function registerAllIpcHandlers(): void {
  registerSessionHandlers();
  registerStatsHandlers();
  registerCourseHandlers();
  registerCourseNoteHandlers();
  registerCourseAttachmentHandlers();
  registerBackupHandlers();
  registerSettingsHandlers();
  registerWindowHandlers();
}
