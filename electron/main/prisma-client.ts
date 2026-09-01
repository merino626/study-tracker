import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { PrismaClient as PrismaClientType } from '@prisma/client';

const ENGINE_FILES: Partial<Record<NodeJS.Platform, string>> = {
  win32: 'query_engine-windows.dll.node',
  darwin: 'libquery_engine-darwin.dylib.node',
  linux: 'libquery_engine-debian-openssl-3.0.x.so.node',
};

function getUnpackedNodeModulesPath(): string {
  return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules');
}

function resolvePrismaClientEntryPath(): string {
  if (app.isPackaged) {
    return path.join(getUnpackedNodeModulesPath(), '@prisma', 'client', 'package.json');
  }

  const nodeRequire = createRequire(import.meta.url);
  return nodeRequire.resolve('@prisma/client/package.json');
}

function resolveQueryEnginePath(): string | null {
  const engineFile = ENGINE_FILES[process.platform];
  if (!engineFile) {
    return null;
  }

  const prismaClientDir = path.dirname(resolvePrismaClientEntryPath());
  const candidates = app.isPackaged
    ? [path.join(getUnpackedNodeModulesPath(), '.prisma', 'client', engineFile)]
    : [path.join(prismaClientDir, '..', '.prisma', 'client', engineFile)];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  return null;
}

function configureQueryEngine(): void {
  const enginePath = resolveQueryEnginePath();
  if (!enginePath) {
    return;
  }

  process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
}

type PrismaClientConstructor = new (
  ...args: ConstructorParameters<typeof PrismaClientType>
) => PrismaClientType;

export function createPrismaClient(
  options?: ConstructorParameters<typeof PrismaClientType>[0],
): PrismaClientType {
  configureQueryEngine();

  const nodeRequire = createRequire(resolvePrismaClientEntryPath());
  const { PrismaClient } = nodeRequire('@prisma/client') as {
    PrismaClient: PrismaClientConstructor;
  };

  return new PrismaClient(options);
}
