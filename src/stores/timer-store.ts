import { create } from 'zustand';
import { MIN_SESSION_DURATION_SECONDS, TIMER_STORAGE_KEY } from '@/lib/constants';
import type { FinishedSessionData, PersistedTimerState, TimerSnapshot } from '@/types/timer';

interface TimerState extends TimerSnapshot {
  start: () => void;
  pause: () => void;
  resume: () => void;
  finish: () => FinishedSessionData | null;
  reset: () => void;
}

const INITIAL_STATE: TimerSnapshot = {
  status: 'idle',
  sessionStartedAt: null,
  segmentStartedAt: null,
  accumulatedSeconds: 0,
  tick: Date.now(),
};

export function computeElapsedSeconds(snapshot: TimerSnapshot): number {
  if (snapshot.status === 'idle') {
    return 0;
  }

  if (snapshot.status === 'paused') {
    return snapshot.accumulatedSeconds;
  }

  if (!snapshot.segmentStartedAt) {
    return snapshot.accumulatedSeconds;
  }

  const segmentElapsed = Math.floor(
    (Date.now() - new Date(snapshot.segmentStartedAt).getTime()) / 1000,
  );

  return snapshot.accumulatedSeconds + segmentElapsed;
}

function clearPersistedState(): void {
  localStorage.removeItem(TIMER_STORAGE_KEY);
}

function savePersistedState(snapshot: TimerSnapshot): void {
  if (snapshot.status === 'idle' || !snapshot.sessionStartedAt) {
    clearPersistedState();
    return;
  }

  const persisted: PersistedTimerState = {
    status: snapshot.status,
    sessionStartedAt: snapshot.sessionStartedAt,
    segmentStartedAt: snapshot.segmentStartedAt,
    accumulatedSeconds: snapshot.accumulatedSeconds,
    lastUpdatedAt: new Date().toISOString(),
  };

  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(persisted));
}

function restoreFromStorage(): TimerSnapshot {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) {
      return INITIAL_STATE;
    }

    const persisted = JSON.parse(raw) as PersistedTimerState;

    if (persisted.status === 'paused') {
      return {
        status: 'paused',
        sessionStartedAt: persisted.sessionStartedAt,
        segmentStartedAt: null,
        accumulatedSeconds: persisted.accumulatedSeconds,
        tick: Date.now(),
      };
    }

    const awaySeconds = Math.floor(
      (Date.now() - new Date(persisted.lastUpdatedAt).getTime()) / 1000,
    );

    return {
      status: 'running',
      sessionStartedAt: persisted.sessionStartedAt,
      segmentStartedAt: new Date().toISOString(),
      accumulatedSeconds: persisted.accumulatedSeconds + awaySeconds,
      tick: Date.now(),
    };
  } catch {
    clearPersistedState();
    return INITIAL_STATE;
  }
}

function persistAfterChange(get: () => TimerState): void {
  savePersistedState(get());
}

export const useTimerStore = create<TimerState>((set, get) => ({
  ...restoreFromStorage(),

  start: () => {
    const now = new Date().toISOString();
    set({
      status: 'running',
      sessionStartedAt: now,
      segmentStartedAt: now,
      accumulatedSeconds: 0,
      tick: Date.now(),
    });
    persistAfterChange(get);
  },

  pause: () => {
    const state = get();
    if (state.status !== 'running') {
      return;
    }

    set({
      status: 'paused',
      segmentStartedAt: null,
      accumulatedSeconds: computeElapsedSeconds(state),
      tick: Date.now(),
    });
    persistAfterChange(get);
  },

  resume: () => {
    const state = get();
    if (state.status !== 'paused') {
      return;
    }

    set({
      status: 'running',
      segmentStartedAt: new Date().toISOString(),
      tick: Date.now(),
    });
    persistAfterChange(get);
  },

  finish: () => {
    const state = get();
    if (state.status === 'idle' || !state.sessionStartedAt) {
      return null;
    }

    const durationSeconds = computeElapsedSeconds(state);

    if (durationSeconds < MIN_SESSION_DURATION_SECONDS) {
      return null;
    }

    const result: FinishedSessionData = {
      startedAt: state.sessionStartedAt,
      endedAt: new Date().toISOString(),
      durationSeconds,
    };

    clearPersistedState();
    set({ ...INITIAL_STATE, tick: Date.now() });

    return result;
  },

  reset: () => {
    clearPersistedState();
    set({ ...INITIAL_STATE, tick: Date.now() });
  },
}));

export function persistTimerTick(): void {
  const state = useTimerStore.getState();
  if (state.status === 'running') {
    savePersistedState(state);
  }
}
