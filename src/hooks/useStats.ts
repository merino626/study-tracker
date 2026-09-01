import { useCallback } from 'react';
import type { StatsSummary } from '@shared/types/models';
import { ipcClient } from '@/services/ipc-client';
import { useAsyncData } from '@/hooks/useAsyncData';

interface UseStatsResult {
  stats: StatsSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStats(): UseStatsResult {
  const fetcher = useCallback(() => ipcClient.stats.get(), []);
  const { data, loading, error, refetch } = useAsyncData(fetcher);

  return {
    stats: data,
    loading,
    error,
    refetch,
  };
}
