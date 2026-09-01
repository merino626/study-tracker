import { useCallback } from 'react';
import type { UpdateSettingsInput } from '@shared/types/models';
import { BackupSection } from '@/components/settings/BackupSection';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { PageState } from '@/components/layout/PageState';
import { useSettings } from '@/hooks/useSettings';
import { useStats } from '@/hooks/useStats';

export function SettingsPage() {
  const { settings, loading, error, updateSettings, pickBackupFolder } = useSettings();
  const { refetch: refetchStats } = useStats();

  const handleUpdate = useCallback(
    async (data: UpdateSettingsInput) => {
      await updateSettings(data);

      if (data.weeklyGoalHours !== undefined) {
        await refetchStats();
      }
    },
    [refetchStats, updateSettings],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personalize metas, aparência, backup e comportamento do aplicativo.
        </p>
      </div>

      <PageState loading={loading} error={error}>
        {settings && (
          <>
            <SettingsForm settings={settings} onUpdate={handleUpdate} />
            <BackupSection
              settings={settings}
              onUpdate={handleUpdate}
              onPickBackupFolder={pickBackupFolder}
            />
          </>
        )}
      </PageState>

      <p className="text-muted-foreground text-center text-xs">Study Tracker v1.0.0</p>
    </div>
  );
}
