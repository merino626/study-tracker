import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { CourseSelect } from '@/components/courses/CourseSelect';
import { TimerControls } from '@/components/timer/TimerControls';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { useCourses } from '@/hooks/useCourses';
import { useTimer } from '@/hooks/useTimer';
import { useCourseSelectStore } from '@/stores/course-select-store';
import { cn } from '@/lib/utils';

interface TimerCardProps {
  onSessionSaved?: () => Promise<void> | void;
}

function getStatusLabel(isRunning: boolean, isPaused: boolean): string {
  if (isRunning) {
    return 'Sessão em andamento';
  }
  if (isPaused) {
    return 'Sessão pausada';
  }
  return 'Nenhuma sessão em andamento';
}

export function TimerCard({ onSessionSaved }: TimerCardProps) {
  const timer = useTimer({ onSessionSaved });
  const { courses } = useCourses();
  const selectedCourseId = useCourseSelectStore((state) => state.selectedCourseId);
  const setSelectedCourseId = useCourseSelectStore((state) => state.setSelectedCourseId);

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        timer.isActive ? 'border-primary/40 shadow-md' : 'border-dashed',
      )}
    >
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CardDescription>Sessão atual</CardDescription>
          <TimerDisplay elapsedSeconds={timer.elapsedSeconds} isActive={timer.isActive} />
        </div>
        <TimerControls
          status={timer.status}
          onStart={() => void timer.start()}
          onPause={timer.pause}
          onResume={timer.resume}
          onFinish={() => void timer.finish()}
          isSaving={timer.isSaving}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <CourseSelect
          courses={courses}
          value={selectedCourseId}
          onChange={setSelectedCourseId}
          disabled={timer.isActive}
        />
        <p className="text-muted-foreground text-sm">
          {getStatusLabel(timer.isRunning, timer.isPaused)}
        </p>
        {timer.saveError && <p className="text-destructive text-sm">{timer.saveError}</p>}
      </CardContent>
    </Card>
  );
}
