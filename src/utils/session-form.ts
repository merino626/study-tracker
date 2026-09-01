import { z } from 'zod';

const MILLISECONDS_PER_SECOND = 1000;

export const sessionFormSchema = z
  .object({
    startedAt: z.string().min(1, 'Informe a data e hora inicial'),
    endedAt: z.string().min(1, 'Informe a data e hora final'),
    courseId: z.string().nullable().optional(),
  })
  .refine((data) => new Date(data.endedAt) > new Date(data.startedAt), {
    message: 'A hora final deve ser posterior à hora inicial',
    path: ['endedAt'],
  });

export type SessionFormValues = z.infer<typeof sessionFormSchema>;

export function toDatetimeLocalValue(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function computeDurationSeconds(startedAt: string, endedAt: string): number {
  const startedMs = new Date(startedAt).getTime();
  const endedMs = new Date(endedAt).getTime();

  return Math.max(0, Math.floor((endedMs - startedMs) / MILLISECONDS_PER_SECOND));
}

export function buildSessionPayload(values: SessionFormValues): {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  courseId: string | null;
} {
  const startedAt = fromDatetimeLocalValue(values.startedAt);
  const endedAt = fromDatetimeLocalValue(values.endedAt);
  const durationSeconds = computeDurationSeconds(startedAt, endedAt);

  return {
    startedAt,
    endedAt,
    durationSeconds,
    courseId: values.courseId ?? null,
  };
}

export function sessionToFormValues(session: {
  startedAt: string;
  endedAt: string;
  courseId?: string | null;
}): SessionFormValues {
  return {
    startedAt: toDatetimeLocalValue(session.startedAt),
    endedAt: toDatetimeLocalValue(session.endedAt),
    courseId: session.courseId ?? null,
  };
}
