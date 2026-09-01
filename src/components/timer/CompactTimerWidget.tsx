import { TimerControls } from '@/components/timer/TimerControls';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';

interface CompactTimerWidgetProps {
  onSessionSaved?: () => Promise<void> | void;
}

export function CompactTimerWidget({ onSessionSaved }: CompactTimerWidgetProps) {
  const timer = useTimer({ onSessionSaved });

  return (
    <div
      className={cn(
        'bg-card relative flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border p-3 shadow-lg',
        'animate-in fade-in zoom-in-95 duration-300',
      )}
    >
      <TimerDisplay
        elapsedSeconds={timer.elapsedSeconds}
        isActive={timer.isActive}
        className="text-2xl"
      />
      <TimerControls
        variant="compact"
        status={timer.status}
        onStart={() => void timer.start()}
        onPause={timer.pause}
        onResume={timer.resume}
        onFinish={() => void timer.finish()}
        isSaving={timer.isSaving}
      />
      {timer.saveError && (
        <p className="text-destructive absolute bottom-1 left-3 text-xs">{timer.saveError}</p>
      )}
    </div>
  );
}
