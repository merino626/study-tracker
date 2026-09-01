import type { StudySession } from '@shared/types/models';
import { SessionItem } from '@/components/history/SessionItem';

interface SessionListProps {
  sessions: StudySession[];
  onEdit?: (session: StudySession) => void;
  onDelete?: (session: StudySession) => void;
  readOnly?: boolean;
  courseNames?: Record<string, string>;
}

export function SessionList({
  sessions,
  onEdit,
  onDelete,
  readOnly = false,
  courseNames,
}: SessionListProps) {
  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          onEdit={onEdit}
          onDelete={onDelete}
          readOnly={readOnly}
          courseName={session.courseId ? courseNames?.[session.courseId] : undefined}
        />
      ))}
    </div>
  );
}
