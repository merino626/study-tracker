import { useCallback } from 'react';
import type { BackupFileInfo, BackupPreview, RestoreBackupInput } from '@shared/types/models';
import { ipcClient } from '@/services/ipc-client';
import { useAsyncData } from '@/hooks/useAsyncData';

interface UseBackupResult {
  backups: BackupFileInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createBackup: () => Promise<BackupFileInfo>;
  validateBackup: (filePath: string) => Promise<{ valid: boolean; errors: string[] }>;
  previewBackup: (filePath: string) => Promise<BackupPreview>;
  restoreBackup: (input: RestoreBackupInput) => Promise<void>;
  pickBackupFile: () => Promise<string | null>;
}

export function useBackup(enabled: boolean): UseBackupResult {
  const fetcher = useCallback(async () => {
    if (!enabled) {
      return [];
    }
    return ipcClient.backup.list();
  }, [enabled]);

  const { data, loading, error, refetch } = useAsyncData(fetcher);

  const createBackup = useCallback(async () => {
    const backup = await ipcClient.backup.create();
    await refetch();
    return backup;
  }, [refetch]);

  const validateBackup = useCallback((filePath: string) => ipcClient.backup.validate(filePath), []);

  const previewBackup = useCallback((filePath: string) => ipcClient.backup.preview(filePath), []);

  const restoreBackup = useCallback(
    async (input: RestoreBackupInput) => {
      await ipcClient.backup.restore(input);
      await refetch();
    },
    [refetch],
  );

  const pickBackupFile = useCallback(() => ipcClient.backup.pickFile(), []);

  return {
    backups: data ?? [],
    loading,
    error,
    refetch,
    createBackup,
    validateBackup,
    previewBackup,
    restoreBackup,
    pickBackupFile,
  };
}
