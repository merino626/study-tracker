import { useCallback, useMemo, useState } from 'react';
import type { StudySession } from '@shared/types/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteSessionDialog } from '@/components/history/DeleteSessionDialog';
import { SessionFormDialog } from '@/components/history/SessionFormDialog';
import { SessionList } from '@/components/history/SessionList';
import { PageState } from '@/components/layout/PageState';
import { useCourses } from '@/hooks/useCourses';
import { useSessions } from '@/hooks/useSessions';
import { useStats } from '@/hooks/useStats';
import type { buildSessionPayload } from '@/utils/session-form';

export function HistoryPage() {
  const { sessions, loading, error, updateSession, deleteSession } = useSessions();
  const { courses } = useCourses();
  const { refetch: refetchStats } = useStats();

  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [deletingSession, setDeletingSession] = useState<StudySession | null>(null);

  const courseNames = useMemo(
    () => Object.fromEntries(courses.map((course) => [course.id, course.name])),
    [courses],
  );

  const handleSessionChanged = useCallback(async () => {
    await refetchStats();
  }, [refetchStats]);

  const handleSave = useCallback(
    async (sessionId: string, data: ReturnType<typeof buildSessionPayload>) => {
      await updateSession(sessionId, data);
      await handleSessionChanged();
    },
    [handleSessionChanged, updateSession],
  );

  const handleDelete = useCallback(
    async (sessionId: string) => {
      await deleteSession(sessionId);
      await handleSessionChanged();
    },
    [deleteSession, handleSessionChanged],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Visualize, edite e exclua suas sessões de estudo.
        </p>
      </div>

      <PageState loading={loading} error={error}>
        <Card>
          <CardHeader>
            <CardTitle>Sessões</CardTitle>
            <CardDescription>
              {sessions.length === 0
                ? 'Nenhuma sessão registrada ainda.'
                : `${sessions.length} sessão(ões) registrada(s).`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Inicie uma sessão no Dashboard para começar a registrar seu tempo de estudo.
              </p>
            ) : (
              <SessionList
                sessions={sessions}
                courseNames={courseNames}
                onEdit={setEditingSession}
                onDelete={setDeletingSession}
              />
            )}
          </CardContent>
        </Card>
      </PageState>

      <SessionFormDialog
        session={editingSession}
        courses={courses}
        open={editingSession !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSession(null);
          }
        }}
        onSave={handleSave}
      />

      <DeleteSessionDialog
        session={deletingSession}
        open={deletingSession !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSession(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
