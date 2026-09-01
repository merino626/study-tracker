import { useCallback } from 'react';
import { CompactTimerWidget } from '@/components/timer/CompactTimerWidget';
import { useStats } from '@/hooks/useStats';

export function CompactLayout() {
  const { refetch } = useStats();

  const handleSessionSaved = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <div className="bg-background flex h-screen items-center justify-center p-3">
      <CompactTimerWidget onSessionSaved={handleSessionSaved} />
    </div>
  );
}
