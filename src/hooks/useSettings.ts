import { useCallback } from 'react';
import type { AppSettings, UpdateSettingsInput } from '@shared/types/models';
import { ipcClient } from '@/services/ipc-client';
import { useAsyncData } from '@/hooks/useAsyncData';

interface UseSettingsResult {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSettings: (data: UpdateSettingsInput) => Promise<AppSettings>;
  pickBackupFolder: () => Promise<string | null>;
}

export function useSettings(): UseSettingsResult {
  const fetcher = useCallback(() => ipcClient.settings.get(), []);
  const { data, loading, error, refetch } = useAsyncData(fetcher);

  const updateSettings = useCallback(
    async (input: UpdateSettingsInput): Promise<AppSettings> => {
      const updated = await ipcClient.settings.update(input);
      await refetch();
      return updated;
    },
    [refetch],
  );

  const pickBackupFolder = useCallback(async (): Promise<string | null> => {
    return ipcClient.settings.pickBackupFolder();
  }, []);

  return {
    settings: data,
    loading,
    error,
    refetch,
    updateSettings,
    pickBackupFolder,
  };
}
