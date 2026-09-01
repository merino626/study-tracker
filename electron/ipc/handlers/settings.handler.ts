import { app, dialog, ipcMain } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS } from '../../../shared/types/ipc-channels';
import { updateSettingsSchema } from '../../../shared/schemas';
import { getPrismaClient } from '../../main/database';
import { getMainWindow, setAlwaysOnTop } from '../../windows/main-window';
import { validateInput, wrapIpcHandler } from '../validate';

function mapSettings(settings: {
  id: string;
  weeklyGoalHours: number;
  theme: string;
  alwaysOnTop: boolean;
  launchOnStartup: boolean;
  backupFolderPath: string | null;
  backupOnQuit: boolean;
  autoBackupDaily: boolean;
  lastAutoBackupAt: Date | null;
  updatedAt: Date;
}) {
  return {
    id: settings.id,
    weeklyGoalHours: settings.weeklyGoalHours,
    theme: settings.theme as 'light' | 'dark' | 'system',
    alwaysOnTop: settings.alwaysOnTop,
    launchOnStartup: settings.launchOnStartup,
    backupFolderPath: settings.backupFolderPath,
    backupOnQuit: settings.backupOnQuit,
    autoBackupDaily: settings.autoBackupDaily,
    lastAutoBackupAt: settings.lastAutoBackupAt?.toISOString() ?? null,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

function applyLaunchOnStartup(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
    args: app.isPackaged ? [] : [path.resolve(process.argv[1] ?? '.')],
  });
}

function applySettingsSideEffects(settings: {
  alwaysOnTop: boolean;
  launchOnStartup: boolean;
}): void {
  setAlwaysOnTop(settings.alwaysOnTop);
  applyLaunchOnStartup(settings.launchOnStartup);
}

export async function syncSettingsEffects(): Promise<void> {
  const prisma = getPrismaClient();
  const settings = await prisma.appSettings.findUnique({ where: { id: 'default' } });

  if (settings) {
    applySettingsSideEffects(settings);
  }
}

export function registerSettingsHandlers(): void {
  const prisma = getPrismaClient();

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_GET,
    wrapIpcHandler(async () => {
      const settings = await prisma.appSettings.findUniqueOrThrow({
        where: { id: 'default' },
      });
      return mapSettings(settings);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_UPDATE,
    wrapIpcHandler(async (_event, data: unknown) => {
      const validated = validateInput(updateSettingsSchema, data);
      const settings = await prisma.appSettings.update({
        where: { id: 'default' },
        data: validated,
      });

      applySettingsSideEffects(settings);

      return mapSettings(settings);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_PICK_BACKUP_FOLDER,
    wrapIpcHandler(async () => {
      const mainWindow = getMainWindow();
      const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Selecionar pasta de backup',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const [folderPath] = result.filePaths;
      return folderPath ?? null;
    }),
  );
}
