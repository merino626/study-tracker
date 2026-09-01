import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatSessionDate(isoDate: string): string {
  return format(new Date(isoDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatSessionTime(isoDate: string): string {
  return format(new Date(isoDate), 'HH:mm');
}

export function formatSessionDateTime(isoDate: string): string {
  return format(new Date(isoDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}
