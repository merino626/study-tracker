import { create } from 'zustand';
import { ipcClient } from '@/services/ipc-client';
import { useTimerStore } from '@/stores/timer-store';

interface CompactModeState {
  isCompact: boolean;
  isTransitioning: boolean;
  enterCompact: () => Promise<void>;
  exitCompact: () => Promise<void>;
  syncOnStartup: () => Promise<void>;
}

function hasActiveTimer(): boolean {
  return useTimerStore.getState().status !== 'idle';
}

export const useCompactModeStore = create<CompactModeState>((set, get) => ({
  isCompact: hasActiveTimer(),
  isTransitioning: false,

  enterCompact: async () => {
    if (get().isCompact || get().isTransitioning) {
      return;
    }

    set({ isTransitioning: true, isCompact: true });

    try {
      await ipcClient.window.enterCompact();
    } catch (error) {
      set({ isCompact: false });
      throw error;
    } finally {
      set({ isTransitioning: false });
    }
  },

  exitCompact: async () => {
    if (!get().isCompact || get().isTransitioning) {
      return;
    }

    set({ isTransitioning: true });

    try {
      await ipcClient.window.exitCompact();
      set({ isCompact: false });
    } finally {
      set({ isTransitioning: false });
    }
  },

  syncOnStartup: async () => {
    if (!hasActiveTimer()) {
      set({ isCompact: false });
      return;
    }

    const isCompactOnMain = await ipcClient.window.getCompactMode();

    if (isCompactOnMain) {
      set({ isCompact: true });
      return;
    }

    await get().enterCompact();
  },
}));
