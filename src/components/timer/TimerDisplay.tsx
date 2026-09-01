import { formatDuration } from '@/utils/time';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  elapsedSeconds: number;
  isActive: boolean;
  className?: string;
}

export function TimerDisplay({ elapsedSeconds, isActive, className }: TimerDisplayProps) {
  return (
    <p
      className={cn(
        'font-mono text-4xl tracking-wider tabular-nums transition-colors',
        isActive ? 'text-foreground' : 'text-muted-foreground',
        className,
      )}
    >
      {formatDuration(elapsedSeconds)}
    </p>
  );
}
