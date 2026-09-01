import { useCallback, useEffect, useState } from 'react';
import { TIMER_TICK_INTERVAL_MS } from '@/lib/constants';
import { ipcClient } from '@/services/ipc-client';
import { useCompactModeStore } from '@/stores/compact-mode-store';
import { useCourseSelectStore } from '@/stores/course-select-store';
import { computeElapsedSeconds, persistTimerTick, useTimerStore } from '@/stores/timer-store';
import type { TimerStatus } from '@/types/timer';

interface UseTimerOptions {
  onSessionSaved?: () => Promise<void> | void;
}

interface UseTimerResult {
  status: TimerStatus;
  elapsedSeconds: number;
  isActive: boolean;
  isRunning: boolean;
  isPaused: boolean;
  isSaving: boolean;
  saveError: string | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  finish: () => Promise<void>;
}

export function useTimer(options?: UseTimerOptions): UseTimerResult {
  const status = useTimerStore((state) => state.status);
  const sessionStartedAt = useTimerStore((state) => state.sessionStartedAt);
  const segmentStartedAt = useTimerStore((state) => state.segmentStartedAt);
  const accumulatedSeconds = useTimerStore((state) => state.accumulatedSeconds);
  const tick = useTimerStore((state) => state.tick);
  const startTimer = useTimerStore((state) => state.start);
  const pause = useTimerStore((state) => state.pause);
  const resume = useTimerStore((state) => state.resume);
  const finishTimer = useTimerStore((state) => state.finish);
  const enterCompact = useCompactModeStore((state) => state.enterCompact);
  const exitCompact = useCompactModeStore((state) => state.exitCompact);
  const selectedCourseId = useCourseSelectStore((state) => state.selectedCourseId);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const elapsedSeconds = computeElapsedSeconds({
    status,
    sessionStartedAt,
    segmentStartedAt,
    accumulatedSeconds,
    tick,
  });

  useEffect(() => {
    if (status !== 'running') {
      return;
    }

    const intervalId = window.setInterval(() => {
      useTimerStore.setState({ tick: Date.now() });
      persistTimerTick();
    }, TIMER_TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status]);

  const start = useCallback(async () => {
    setSaveError(null);
    startTimer();
    await enterCompact();
  }, [enterCompact, startTimer]);

  const finish = useCallback(async () => {
    setSaveError(null);

    const sessionData = finishTimer();

    if (!sessionData) {
      if (status !== 'idle') {
        setSaveError('A sessão precisa ter pelo menos 1 segundo para ser salva.');
      }
      return;
    }

    try {
      setIsSaving(true);
      await ipcClient.sessions.create({
        ...sessionData,
        courseId: selectedCourseId,
      });
      await exitCompact();
      await options?.onSessionSaved?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar sessão';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [exitCompact, finishTimer, options, selectedCourseId, status]);

  return {
    status,
    elapsedSeconds,
    isActive: status !== 'idle',
    isRunning: status === 'running',
    isPaused: status === 'paused',
    isSaving,
    saveError,
    start,
    pause,
    resume,
    finish,
  };
}
