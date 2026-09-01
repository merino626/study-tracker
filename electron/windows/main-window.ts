import { BrowserWindow, nativeImage, screen } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBuildAsset } from '../main/paths';
import {
  APP_NAME,
  COMPACT_WINDOW_HEIGHT,
  COMPACT_WINDOW_WIDTH,
  MAIN_WINDOW_HEIGHT,
  MAIN_WINDOW_MIN_HEIGHT,
  MAIN_WINDOW_MIN_WIDTH,
  MAIN_WINDOW_WIDTH,
  WINDOW_ANIMATION_DURATION_MS,
  WINDOW_COMPACT_MARGIN,
} from '../../shared/constants';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let savedBounds: Electron.Rectangle | null = null;
let isCompactMode = false;
let animationTimer: ReturnType<typeof setInterval> | null = null;

function getAppIcon(): Electron.NativeImage | undefined {
  const iconPath = resolveBuildAsset('icon.png');

  if (!fs.existsSync(iconPath)) {
    return undefined;
  }

  return nativeImage.createFromPath(iconPath);
}

function getPreloadPath(): string {
  return path.join(__dirname, '../preload/index.mjs');
}

function getRendererUrl(): string {
  if (process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL;
  }
  return path.join(__dirname, '../../dist/index.html');
}

function clearAnimation(): void {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function animateBounds(targetBounds: Electron.Rectangle): Promise<void> {
  return new Promise((resolve) => {
    if (!mainWindow) {
      resolve();
      return;
    }

    clearAnimation();
    const startBounds = mainWindow.getBounds();
    const startTime = Date.now();

    animationTimer = setInterval(() => {
      if (!mainWindow) {
        clearAnimation();
        resolve();
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / WINDOW_ANIMATION_DURATION_MS, 1);
      const eased = easeOutCubic(progress);

      mainWindow.setBounds({
        x: Math.round(startBounds.x + (targetBounds.x - startBounds.x) * eased),
        y: Math.round(startBounds.y + (targetBounds.y - startBounds.y) * eased),
        width: Math.round(startBounds.width + (targetBounds.width - startBounds.width) * eased),
        height: Math.round(startBounds.height + (targetBounds.height - startBounds.height) * eased),
      });

      if (progress >= 1) {
        clearAnimation();
        resolve();
      }
    }, 16);
  });
}

function getCompactBounds(): Electron.Rectangle {
  const display = screen.getDisplayNearestPoint(
    mainWindow ? mainWindow.getBounds() : screen.getPrimaryDisplay().bounds,
  );
  const { workArea } = display;

  return {
    x: workArea.x + workArea.width - COMPACT_WINDOW_WIDTH - WINDOW_COMPACT_MARGIN,
    y: workArea.y + workArea.height - COMPACT_WINDOW_HEIGHT - WINDOW_COMPACT_MARGIN,
    width: COMPACT_WINDOW_WIDTH,
    height: COMPACT_WINDOW_HEIGHT,
  };
}

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: MAIN_WINDOW_WIDTH,
    height: MAIN_WINDOW_HEIGHT,
    minWidth: MAIN_WINDOW_MIN_WIDTH,
    minHeight: MAIN_WINDOW_MIN_HEIGHT,
    show: false,
    title: APP_NAME,
    icon: getAppIcon(),
    backgroundColor: '#09090b',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const rendererUrl = getRendererUrl();
  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(rendererUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(rendererUrl);
  }

  mainWindow.on('closed', () => {
    clearAnimation();
    mainWindow = null;
    savedBounds = null;
    isCompactMode = false;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export async function enterCompactMode(): Promise<void> {
  if (!mainWindow || isCompactMode) {
    return;
  }

  savedBounds = mainWindow.getBounds();
  isCompactMode = true;

  mainWindow.setMinimumSize(COMPACT_WINDOW_WIDTH, COMPACT_WINDOW_HEIGHT);
  mainWindow.setResizable(false);
  mainWindow.setAlwaysOnTop(true, 'floating');

  await animateBounds(getCompactBounds());
}

export async function exitCompactMode(): Promise<void> {
  if (!mainWindow || !isCompactMode) {
    return;
  }

  isCompactMode = false;
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setResizable(true);
  mainWindow.setMinimumSize(MAIN_WINDOW_MIN_WIDTH, MAIN_WINDOW_MIN_HEIGHT);

  const targetBounds = savedBounds ?? {
    x: mainWindow.getBounds().x,
    y: mainWindow.getBounds().y,
    width: MAIN_WINDOW_WIDTH,
    height: MAIN_WINDOW_HEIGHT,
  };

  await animateBounds(targetBounds);
  savedBounds = null;
}

export function setAlwaysOnTop(value: boolean): void {
  if (!mainWindow || isCompactMode) {
    return;
  }
  mainWindow.setAlwaysOnTop(value, 'floating');
}

export function isInCompactMode(): boolean {
  return isCompactMode;
}
