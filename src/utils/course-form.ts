import { z } from 'zod';
import { COURSE_PLATFORMS, COURSE_PRIORITIES, COURSE_STATUSES } from '@shared/constants/courses';

export const courseFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  platform: z.string().min(1, 'Plataforma é obrigatória'),
  url: z.string().url('URL inválida').or(z.literal('')).optional(),
  instructor: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  officialHours: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  status: z.enum(COURSE_STATUSES),
  priority: z.enum(COURSE_PRIORITIES),
  rating: z.string().optional(),
  notes: z.string().max(50000).optional(),
  tags: z.string().optional(),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const PLATFORM_OPTIONS = [...COURSE_PLATFORMS];

export function courseToFormValues(course: {
  name: string;
  platform: string;
  url: string | null;
  instructor: string | null;
  category: string | null;
  officialHours: number | null;
  startedAt: string | null;
  completedAt: string | null;
  status: CourseFormValues['status'];
  priority: CourseFormValues['priority'];
  rating: number | null;
  notes: string;
  tags: string[];
}): CourseFormValues {
  return {
    name: course.name,
    platform: course.platform,
    url: course.url ?? '',
    instructor: course.instructor ?? '',
    category: course.category ?? '',
    officialHours: course.officialHours ? String(course.officialHours) : '',
    startedAt: course.startedAt ? course.startedAt.slice(0, 10) : '',
    completedAt: course.completedAt ? course.completedAt.slice(0, 10) : '',
    status: course.status,
    priority: course.priority,
    rating: course.rating ? String(course.rating) : '',
    notes: course.notes,
    tags: course.tags.join(', '),
  };
}

export function buildCoursePayload(values: CourseFormValues) {
  const officialHours = values.officialHours ? Number(values.officialHours) : null;
  const rating = values.rating ? Number(values.rating) : null;

  return {
    name: values.name.trim(),
    platform: values.platform.trim(),
    url: values.url?.trim() || null,
    instructor: values.instructor?.trim() || null,
    category: values.category?.trim() || null,
    officialHours: officialHours && !Number.isNaN(officialHours) ? officialHours : null,
    startedAt: values.startedAt ? new Date(values.startedAt).toISOString() : null,
    completedAt: values.completedAt ? new Date(values.completedAt).toISOString() : null,
    status: values.status,
    priority: values.priority,
    rating: rating && rating >= 1 && rating <= 5 ? rating : null,
    notes: values.notes?.trim() ?? '',
    tags: values.tags
      ? values.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
  };
}

export const emptyCourseFormValues: CourseFormValues = {
  name: '',
  platform: 'Udemy',
  url: '',
  instructor: '',
  category: '',
  officialHours: '',
  startedAt: '',
  completedAt: '',
  status: 'not_started',
  priority: 'medium',
  rating: '',
  notes: '',
  tags: '',
};
