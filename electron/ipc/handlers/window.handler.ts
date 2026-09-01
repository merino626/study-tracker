import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../../shared/types/ipc-channels';
import {
  enterCompactMode,
  exitCompactMode,
  isInCompactMode,
  setAlwaysOnTop,
} from '../../windows/main-window';
import { wrapIpcHandler } from '../validate';

export function registerWindowHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.WINDOW_ENTER_COMPACT,
    wrapIpcHandler(async () => {
      await enterCompactMode();
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.WINDOW_EXIT_COMPACT,
    wrapIpcHandler(async () => {
      await exitCompactMode();
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.WINDOW_SET_ALWAYS_ON_TOP,
    wrapIpcHandler(async (_event, value: boolean) => {
      setAlwaysOnTop(value);
    }),
  );

  ipcMain.handle(
    IPC_CHANNELS.WINDOW_GET_COMPACT_MODE,
    wrapIpcHandler(async () => {
      return isInCompactMode();
    }),
  );
}
