export type TimerStatus = 'idle' | 'running' | 'paused';

export interface FinishedSessionData {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  courseId?: string | null;
}

export interface PersistedTimerState {
  status: 'running' | 'paused';
  sessionStartedAt: string;
  segmentStartedAt: string | null;
  accumulatedSeconds: number;
  lastUpdatedAt: string;
}

export interface TimerSnapshot {
  status: TimerStatus;
  sessionStartedAt: string | null;
  segmentStartedAt: string | null;
  accumulatedSeconds: number;
  tick: number;
}
