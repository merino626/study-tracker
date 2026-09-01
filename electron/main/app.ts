import { app, BrowserWindow, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { createBackup, runDailyBackupIfNeeded } from './backup';
import { disconnectDatabase, getPrismaClient, initializeDatabase } from './database';
import { syncSettingsEffects } from '../ipc/handlers/settings.handler';
import { registerAllIpcHandlers } from '../ipc/index';
import { createMainWindow } from '../windows/main-window';

const SINGLE_INSTANCE_LOCK = app.requestSingleInstanceLock();

if (!SINGLE_INSTANCE_LOCK) {
  app.quit();
}

function showStartupError(error: unknown): void {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);

  try {
    const logPath = path.join(process.env.TEMP ?? '.', 'study-tracker-error.log');
    fs.appendFileSync(logPath, `${new Date().toISOString()}\n${message}\n\n`);
  } catch {
    // ignore logging failures
  }

  dialog.showErrorBox('Study Tracker - Erro ao iniciar', message);
}

export async function initializeApp(): Promise<void> {
  if (!SINGLE_INSTANCE_LOCK) {
    return;
  }

  try {
    await app.whenReady();

    registerAllIpcHandlers();
    await initializeDatabase();
    await syncSettingsEffects();
    await runDailyBackupIfNeeded(getPrismaClient());
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });

    app.on('second-instance', () => {
      const windows = BrowserWindow.getAllWindows();
      const window = windows[0];
      if (!window) {
        return;
      }
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    });
  } catch (error) {
    showStartupError(error);
    app.quit();
  }
}

export function setupAppLifecycle(): void {
  process.on('uncaughtException', (error) => {
    showStartupError(error);
    app.quit();
  });

  process.on('unhandledRejection', (reason) => {
    showStartupError(reason);
    app.quit();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      void disconnectDatabase().finally(() => {
        app.quit();
      });
    }
  });

  app.on('before-quit', () => {
    const client = getPrismaClient();
    void client.appSettings
      .findUnique({ where: { id: 'default' } })
      .then((settings) => {
        if (settings?.backupOnQuit && settings.backupFolderPath) {
          return createBackup(client, 'quit');
        }
        return undefined;
      })
      .catch(() => undefined)
      .finally(() => {
        void disconnectDatabase();
      });
  });
}
