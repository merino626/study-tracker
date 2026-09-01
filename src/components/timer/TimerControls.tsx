import { Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TimerStatus } from '@/types/timer';
import { cn } from '@/lib/utils';

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  isSaving?: boolean;
  variant?: 'default' | 'compact';
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onFinish,
  isSaving = false,
  variant = 'default',
}: TimerControlsProps) {
  const isCompact = variant === 'compact';

  if (status === 'idle') {
    return (
      <Button
        size={isCompact ? 'default' : 'lg'}
        className="gap-2"
        onClick={onStart}
        disabled={isSaving}
      >
        <Play className="size-4" />
        Iniciar
      </Button>
    );
  }

  const buttonSize = isCompact ? 'icon' : 'default';
  const showLabel = !isCompact;

  return (
    <div className={cn('flex gap-2', isCompact ? 'items-center' : 'flex-wrap')}>
      {status === 'running' ? (
        <Button
          variant="outline"
          size={buttonSize}
          className={cn(!isCompact && 'gap-2')}
          onClick={onPause}
          disabled={isSaving}
          title="Pausar"
        >
          <Pause className="size-4" />
          {showLabel && 'Pausar'}
        </Button>
      ) : (
        <Button
          size={buttonSize}
          className={cn(!isCompact && 'gap-2')}
          onClick={onResume}
          disabled={isSaving}
          title="Continuar"
        >
          <Play className="size-4" />
          {showLabel && 'Continuar'}
        </Button>
      )}
      <Button
        variant="destructive"
        size={buttonSize}
        className={cn(!isCompact && 'gap-2')}
        onClick={onFinish}
        disabled={isSaving}
        title="Finalizar"
      >
        <Square className="size-4" />
        {showLabel && (isSaving ? 'Salvando...' : 'Finalizar')}
      </Button>
    </div>
  );
}
