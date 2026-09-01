import { app } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function resolveProjectRoot(): string {
  if (app.isPackaged) {
    return process.resourcesPath;
  }

  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
}

export function resolvePrismaMigrationsDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'prisma', 'migrations');
  }

  return path.join(resolveProjectRoot(), 'prisma', 'migrations');
}

export function resolveBuildAsset(...segments: string[]): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'build', ...segments);
  }

  return path.join(resolveProjectRoot(), 'build', ...segments);
}
