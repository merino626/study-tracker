import { dialog, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../../shared/types/ipc-channels';
import { backupFilePathSchema, restoreBackupSchema } from '../../../shared/schemas';
import { getPrismaClient } from '../../main/database';
import {
  createBackup,
  listBackupFiles,
  previewBackupFile,
  resolveBackupFolder,
  restoreBackup,
  validateBackupFile,
} from '../../main/backup';
import { getMainWindow } from '../../windows/main-window';
import { validateInput, wrapIpcHandler } from '../validate';

export function registerBackupHandlers(): void {
  const prisma = getPrismaClient();

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_CREATE,
    wrapIpcHandler(async () => createBackup(prisma, 'manual')),
  );

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_LIST,
    wrapIpcHandler(async () => {
      const folderPath = await resolveBackupFolder(prisma);
      return listBackupFiles(folderPath);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_VALIDATE,
    wrapIpcHandler(async (_event, filePath: unknown) => {
      const validated = validateInput(backupFilePathSchema, { filePath });
      return validateBackupFile(validated.filePath);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_PREVIEW,
    wrapIpcHandler(async (_event, filePath: unknown) => {
      const validated = validateInput(backupFilePathSchema, { filePath });
      return previewBackupFile(validated.filePath);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_RESTORE,
    wrapIpcHandler(async (_event, input: unknown) => {
      const validated = validateInput(restoreBackupSchema, input);
      await restoreBackup(prisma, validated.filePath, validated.modules);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_PICK_FILE,
    wrapIpcHandler(async () => {
      const mainWindow = getMainWindow();
      const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
        properties: ['openFile'],
        title: 'Selecionar arquivo de backup',
        filters: [{ name: 'Backup ZIP', extensions: ['zip'] }],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0] ?? null;
    }),
  );
}
