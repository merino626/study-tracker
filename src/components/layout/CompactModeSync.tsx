import { useEffect } from 'react';
import { useCompactModeStore } from '@/stores/compact-mode-store';

export function CompactModeSync() {
  const syncOnStartup = useCompactModeStore((state) => state.syncOnStartup);

  useEffect(() => {
    void syncOnStartup();
  }, [syncOnStartup]);

  return null;
}
