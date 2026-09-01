import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { createPrismaClient } from './prisma-client';
import { applyMigrations, isDatabaseSchemaReady } from './migrations';
import { createBackup } from './backup';
import { resolveProjectRoot } from './paths';

let prisma: PrismaClient | null = null;

export function resolveDatabasePath(): string {
  if (!app.isPackaged) {
    return path.join(resolveProjectRoot(), 'database', 'study-tracker.db');
  }

  return path.join(app.getPath('userData'), 'study-tracker.db');
}

function resolveDatabaseUrl(): string {
  const dbPath = resolveDatabasePath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return `file:${dbPath}`;
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = createPrismaClient({
      datasources: {
        db: {
          url: resolveDatabaseUrl(),
        },
      },
    });
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

async function backupBeforeMigration(migrationId: string): Promise<void> {
  void migrationId;
  const client = getPrismaClient();

  // Prisma ORM exige schema completo; durante catch-up de migrations o banco está incompleto.
  if (!(await isDatabaseSchemaReady(client))) {
    return;
  }

  const settings = await client.appSettings.findUnique({ where: { id: 'default' } });
  if (!settings?.backupFolderPath) {
    return;
  }

  try {
    await createBackup(client, 'migration');
  } catch {
    // backup before migration is best-effort
  }
}

export async function initializeDatabase(): Promise<void> {
  const client = getPrismaClient();
  await applyMigrations(client, backupBeforeMigration);

  if (!(await isDatabaseSchemaReady(client))) {
    throw new Error(
      'Banco de dados incompleto. Exclua %APPDATA%\\study-tracker\\study-tracker.db e reinicie o aplicativo.',
    );
  }

  await client.appSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      updatedAt: new Date(),
    },
  });
}
