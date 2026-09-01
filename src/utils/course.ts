import type { CoursePriority, CourseStatus } from '@shared/constants/courses';

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  not_started: 'Não iniciado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  paused: 'Pausado',
};

export const COURSE_PRIORITY_LABELS: Record<CoursePriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export function formatRelativeTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `há ${days} dia${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
  return 'agora mesmo';
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
