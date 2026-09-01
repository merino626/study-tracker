import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Course, CourseStats } from '@shared/types/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseFormDialog } from '@/components/courses/CourseFormDialog';
import { CourseItem } from '@/components/courses/CourseItem';
import { CourseStatsDialog } from '@/components/courses/CourseStatsDialog';
import { DeleteCourseDialog } from '@/components/courses/DeleteCourseDialog';
import { PageState } from '@/components/layout/PageState';
import { useCourses } from '@/hooks/useCourses';
import type { buildCoursePayload } from '@/utils/course-form';

export function CoursesPage() {
  const { courses, loading, error, createCourse, updateCourse, deleteCourse, getCourseStats } =
    useCourses();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [statsCourse, setStatsCourse] = useState<Course | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  const handleSave = useCallback(
    async (courseId: string | null, data: ReturnType<typeof buildCoursePayload>) => {
      if (courseId) {
        await updateCourse(courseId, data);
      } else {
        await createCourse(data);
      }
    },
    [createCourse, updateCourse],
  );

  const handleViewStats = useCallback(
    async (course: Course) => {
      const stats = await getCourseStats(course.id);
      setStatsCourse(course);
      setCourseStats(stats);
      setStatsOpen(true);
    },
    [getCourseStats],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cursos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie seus cursos e acompanhe o progresso de cada um.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingCourse(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Novo curso
        </Button>
      </div>

      <PageState loading={loading} error={error}>
        <Card>
          <CardHeader>
            <CardTitle>Meus cursos</CardTitle>
            <CardDescription>
              {courses.length === 0
                ? 'Nenhum curso cadastrado ainda.'
                : `${courses.length} curso(s) cadastrado(s).`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Cadastre um curso para vincular às suas sessões de estudo.
              </p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <CourseItem
                    key={course.id}
                    course={course}
                    onEdit={(item) => {
                      setEditingCourse(item);
                      setFormOpen(true);
                    }}
                    onDelete={setDeletingCourse}
                    onViewStats={(item) => void handleViewStats(item)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageState>

      <CourseFormDialog
        course={editingCourse}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />

      <DeleteCourseDialog
        course={deletingCourse}
        open={deletingCourse !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCourse(null);
          }
        }}
        onConfirm={deleteCourse}
      />

      <CourseStatsDialog
        courseName={statsCourse?.name ?? ''}
        stats={courseStats}
        open={statsOpen}
        onOpenChange={setStatsOpen}
      />
    </div>
  );
}
