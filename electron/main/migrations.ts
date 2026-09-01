import fs from 'node:fs';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { resolvePrismaMigrationsDir } from './paths';
import { hasSqliteColumn, hasSqliteTable } from './sqlite-introspection';

const MIGRATIONS = [
  '20260707022828_init',
  '20260707180000_add_courses_and_backup',
  '20260707200000_add_course_notebook',
] as const;

const MIGRATION_TRACKER_TABLE = '_study_tracker_migrations';

const IGNORABLE_MIGRATION_ERROR_PATTERNS = ['duplicate column name', 'already exists'] as const;

function resolveMigrationsDir(): string {
  return resolvePrismaMigrationsDir();
}

function isIgnorableMigrationError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return IGNORABLE_MIGRATION_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

async function ensureMigrationTracker(client: PrismaClient): Promise<void> {
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${MIGRATION_TRACKER_TABLE}" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function markMigrationApplied(client: PrismaClient, migrationId: string): Promise<void> {
  await client.$executeRawUnsafe(
    `INSERT OR IGNORE INTO "${MIGRATION_TRACKER_TABLE}" ("id") VALUES ('${migrationId}')`,
  );
}

async function unmarkMigration(client: PrismaClient, migrationId: string): Promise<void> {
  await client.$executeRawUnsafe(
    `DELETE FROM "${MIGRATION_TRACKER_TABLE}" WHERE "id" = '${migrationId}'`,
  );
}

async function isInitMigrationComplete(client: PrismaClient): Promise<boolean> {
  return (
    (await hasSqliteTable(client, 'StudySession')) && (await hasSqliteTable(client, 'AppSettings'))
  );
}

async function isCoursesMigrationComplete(client: PrismaClient): Promise<boolean> {
  return (
    (await hasSqliteTable(client, 'Course')) &&
    (await hasSqliteColumn(client, 'AppSettings', 'backupOnQuit'))
  );
}

async function isNotebookMigrationComplete(client: PrismaClient): Promise<boolean> {
  return await hasSqliteTable(client, 'CourseNote');
}

export async function isDatabaseSchemaReady(client: PrismaClient): Promise<boolean> {
  return (
    (await isInitMigrationComplete(client)) &&
    (await isCoursesMigrationComplete(client)) &&
    (await isNotebookMigrationComplete(client))
  );
}

async function seedLegacyMigrations(client: PrismaClient): Promise<void> {
  if (await isInitMigrationComplete(client)) {
    await markMigrationApplied(client, '20260707022828_init');
  }

  if (await isCoursesMigrationComplete(client)) {
    await markMigrationApplied(client, '20260707180000_add_courses_and_backup');
  }

  if (await isNotebookMigrationComplete(client)) {
    await markMigrationApplied(client, '20260707200000_add_course_notebook');
  }
}

async function repairInconsistentMigrationState(client: PrismaClient): Promise<void> {
  const applied = await getAppliedMigrations(client);

  if (applied.has('20260707022828_init') && !(await isInitMigrationComplete(client))) {
    await unmarkMigration(client, '20260707022828_init');
    await unmarkMigration(client, '20260707180000_add_courses_and_backup');
    await unmarkMigration(client, '20260707200000_add_course_notebook');
    return;
  }

  if (
    applied.has('20260707180000_add_courses_and_backup') &&
    !(await isCoursesMigrationComplete(client))
  ) {
    await unmarkMigration(client, '20260707180000_add_courses_and_backup');
    await unmarkMigration(client, '20260707200000_add_course_notebook');
    return;
  }

  if (
    applied.has('20260707200000_add_course_notebook') &&
    !(await isNotebookMigrationComplete(client))
  ) {
    await unmarkMigration(client, '20260707200000_add_course_notebook');
  }

  if (
    (await hasSqliteTable(client, 'StudySession')) &&
    !(await hasSqliteTable(client, 'AppSettings'))
  ) {
    await unmarkMigration(client, '20260707022828_init');
    await unmarkMigration(client, '20260707180000_add_courses_and_backup');
    await unmarkMigration(client, '20260707200000_add_course_notebook');
  }

  if (
    (await hasSqliteTable(client, 'AppSettings')) &&
    !(await hasSqliteColumn(client, 'AppSettings', 'backupOnQuit'))
  ) {
    await unmarkMigration(client, '20260707180000_add_courses_and_backup');
    await unmarkMigration(client, '20260707200000_add_course_notebook');
  }
}

async function getAppliedMigrations(client: PrismaClient): Promise<Set<string>> {
  const rows = await client.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "${MIGRATION_TRACKER_TABLE}"`,
  );

  return new Set(rows.map((row) => row.id));
}

function stripLineComments(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .trim();
}

function parseSqlStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => stripLineComments(statement))
    .filter((statement) => statement.length > 0);
}

async function executeStatement(client: PrismaClient, statement: string): Promise<void> {
  try {
    await client.$executeRawUnsafe(statement);
  } catch (error) {
    if (!isIgnorableMigrationError(error)) {
      throw error;
    }
  }
}

async function applyMigrationFile(
  client: PrismaClient,
  migrationId: string,
  migrationsDir: string,
): Promise<void> {
  const migrationPath = path.join(migrationsDir, migrationId, 'migration.sql');

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Arquivo de migration não encontrado: ${migrationPath}`);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  const statements = parseSqlStatements(sql);

  for (const statement of statements) {
    await executeStatement(client, statement);
  }

  await markMigrationApplied(client, migrationId);
}

export async function applyMigrations(
  client: PrismaClient,
  onBeforeMigration?: (migrationId: string) => Promise<void>,
): Promise<void> {
  await ensureMigrationTracker(client);
  await seedLegacyMigrations(client);
  await repairInconsistentMigrationState(client);

  const migrationsDir = resolveMigrationsDir();
  const applied = await getAppliedMigrations(client);

  for (const migrationId of MIGRATIONS) {
    if (applied.has(migrationId)) {
      continue;
    }

    if (onBeforeMigration) {
      await onBeforeMigration(migrationId);
    }

    await applyMigrationFile(client, migrationId, migrationsDir);
  }

  if (!(await hasSqliteTable(client, 'AppSettings'))) {
    throw new Error(
      'Falha ao inicializar o banco de dados: tabela AppSettings não foi criada. ' +
        'Remova o arquivo study-tracker.db em %APPDATA%\\study-tracker e abra o app novamente.',
    );
  }

  if (!(await isDatabaseSchemaReady(client))) {
    throw new Error(
      'Falha ao inicializar o banco de dados: schema incompleto após migrations. ' +
        'Remova o arquivo study-tracker.db em %APPDATA%\\study-tracker e abra o app novamente.',
    );
  }
}
