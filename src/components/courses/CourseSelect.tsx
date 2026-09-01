import type { Course } from '@shared/types/models';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CourseSelectProps {
  courses: Course[];
  value: string | null;
  onChange: (courseId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function CourseSelect({
  courses,
  value,
  onChange,
  disabled = false,
  className,
}: CourseSelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="courseSelect">Curso (opcional)</Label>
      <select
        id="courseSelect"
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Nenhum curso</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name} ({course.platform})
          </option>
        ))}
      </select>
    </div>
  );
}
