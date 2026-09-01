import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, Pencil, Trash2 } from 'lucide-react';
import type { Course } from '@shared/types/models';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { COURSE_PRIORITY_LABELS, COURSE_STATUS_LABELS } from '@/utils/course';
import { formatHoursDecimal, formatDurationShort } from '@/utils/time';

interface CourseItemProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onViewStats: (course: Course) => void;
}

export function CourseItem({ course, onEdit, onDelete, onViewStats }: CourseItemProps) {
  const completionPercentage =
    course.officialHours && course.officialHours > 0
      ? Math.min(100, (course.studiedSeconds / 3600 / course.officialHours) * 100)
      : 0;

  return (
    <div className="hover:bg-accent/40 space-y-3 rounded-lg border px-4 py-3 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            to={`/courses/${course.id}`}
            className="hover:text-primary truncate text-sm font-medium transition-colors"
          >
            {course.name}
          </Link>
          <p className="text-muted-foreground text-xs">
            {course.platform}
            {course.category ? ` · ${course.category}` : ''}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
              {COURSE_STATUS_LABELS[course.status]}
            </span>
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
              Prioridade {COURSE_PRIORITY_LABELS[course.priority].toLowerCase()}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" title="Abrir curso" asChild>
            <Link to={`/courses/${course.id}`}>
              <BookOpen className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewStats(course)}
            title="Estatísticas"
          >
            <BarChart3 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(course)} title="Editar curso">
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(course)}
            title="Excluir curso"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {formatHoursDecimal(course.studiedSeconds)}h estudadas
            {course.officialHours ? ` / ${course.officialHours}h` : ''}
          </span>
          {course.officialHours ? (
            <span className="font-medium">{completionPercentage.toFixed(0)}%</span>
          ) : (
            <span className="text-muted-foreground">
              {formatDurationShort(course.studiedSeconds)}
            </span>
          )}
        </div>
        {course.officialHours ? <Progress value={completionPercentage} className="h-2" /> : null}
      </div>
    </div>
  );
}
