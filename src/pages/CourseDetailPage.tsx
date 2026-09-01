import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CourseFormDialog } from '@/components/courses/CourseFormDialog';
import { CourseNotebookTab } from '@/components/courses/CourseNotebookTab';
import { PageState } from '@/components/layout/PageState';
import { SessionList } from '@/components/history/SessionList';
import { useCourseDetail } from '@/hooks/useCourses';
import { useCourses } from '@/hooks/useCourses';
import { ipcClient } from '@/services/ipc-client';
import { useAsyncData } from '@/hooks/useAsyncData';
import { COURSE_PRIORITY_LABELS, COURSE_STATUS_LABELS, formatPercentage } from '@/utils/course';
import { formatHoursDecimal, formatDurationShort } from '@/utils/time';
import type { CourseStats } from '@shared/types/models';
import type { buildCoursePayload } from '@/utils/course-form';
import { cn } from '@/lib/utils';

type DetailTab = 'overview' | 'notebook' | 'sessions';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'notebook', label: 'Caderno' },
  { id: 'sessions', label: 'Sessões' },
];

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: course, loading, error, refetch } = useCourseDetail(courseId);
  const { updateCourse } = useCourses();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [editOpen, setEditOpen] = useState(false);

  const statsFetcher = useCallback(async () => {
    if (!courseId) {
      return null;
    }
    return ipcClient.courses.stats(courseId);
  }, [courseId]);

  const { data: stats } = useAsyncData<CourseStats | null>(statsFetcher);

  const handleSave = useCallback(
    async (_id: string | null, data: ReturnType<typeof buildCoursePayload>) => {
      if (!courseId) {
        return;
      }
      await updateCourse(courseId, data);
      await refetch();
    },
    [courseId, refetch, updateCourse],
  );

  const completionPercentage =
    course?.officialHours && course.officialHours > 0
      ? Math.min(100, (course.studiedSeconds / 3600 / course.officialHours) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" className="gap-2 px-0" asChild>
            <Link to="/courses">
              <ArrowLeft className="size-4" />
              Voltar aos cursos
            </Link>
          </Button>

          <PageState loading={loading} error={error}>
            {course && (
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {course.platform}
                  {course.instructor ? ` · ${course.instructor}` : ''}
                  {course.category ? ` · ${course.category}` : ''}
                </p>
              </div>
            )}
          </PageState>
        </div>

        {course && (
          <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar curso
          </Button>
        )}
      </div>

      {course && (
        <>
          <div className="flex flex-wrap gap-2 border-b pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-background text-foreground border-x border-t'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                {tab.id === 'notebook' && course.notesCount > 0 ? ` (${course.notesCount})` : ''}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Progresso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Horas estudadas</p>
                      <p className="text-lg font-semibold">
                        {formatHoursDecimal(course.studiedSeconds)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Conclusão</p>
                      <p className="text-lg font-semibold">
                        {formatPercentage(completionPercentage)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Status</p>
                      <p className="font-medium">{COURSE_STATUS_LABELS[course.status]}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Prioridade</p>
                      <p className="font-medium">{COURSE_PRIORITY_LABELS[course.priority]}</p>
                    </div>
                  </div>
                  {course.officialHours ? (
                    <Progress value={completionPercentage} className="h-2" />
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {course.url && (
                    <p>
                      <span className="text-muted-foreground">URL: </span>
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {course.url}
                      </a>
                    </p>
                  )}
                  {course.officialHours && (
                    <p>
                      <span className="text-muted-foreground">Carga horária: </span>
                      {course.officialHours}h
                    </p>
                  )}
                  {course.rating && (
                    <p>
                      <span className="text-muted-foreground">Avaliação: </span>
                      {course.rating}/5
                    </p>
                  )}
                  {course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {course.tags.map((tag) => (
                        <span key={tag} className="bg-muted rounded-full px-2 py-0.5 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {course.notes && (
                    <div className="pt-2">
                      <p className="text-muted-foreground mb-1 text-xs">Resumo</p>
                      <p className="whitespace-pre-wrap">{course.notes}</p>
                    </div>
                  )}
                  <p className="text-muted-foreground pt-2 text-xs">
                    {course.notesCount} página(s) no caderno · {course.attachmentsCount} anexo(s)
                  </p>
                </CardContent>
              </Card>

              {stats && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Estatísticas rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Sessões</p>
                      <p className="text-lg font-semibold">{stats.sessionsCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Média por sessão</p>
                      <p className="text-lg font-semibold">
                        {formatDurationShort(stats.averageSessionSeconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Páginas no caderno</p>
                      <p className="text-lg font-semibold">{course.notesCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Anexos</p>
                      <p className="text-lg font-semibold">{course.attachmentsCount}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'notebook' && courseId && <CourseNotebookTab courseId={courseId} />}

          {activeTab === 'sessions' && stats && (
            <Card>
              <CardHeader>
                <CardTitle>Sessões de estudo</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.sessions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma sessão vinculada a este curso ainda.
                  </p>
                ) : (
                  <SessionList sessions={stats.sessions} readOnly />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!loading && !course && !error && (
        <div className="space-y-3 text-center">
          <p className="text-muted-foreground text-sm">Curso não encontrado.</p>
          <Button onClick={() => navigate('/courses')}>Voltar</Button>
        </div>
      )}

      <CourseFormDialog
        course={course}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSave}
      />
    </div>
  );
}
