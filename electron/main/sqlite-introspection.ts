import type { PrismaClient } from '@prisma/client';

const SQL_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertSqlIdentifier(value: string): string {
  if (!SQL_IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`Identificador SQL inválido: ${value}`);
  }

  return value;
}

export async function hasSqliteTable(client: PrismaClient, tableName: string): Promise<boolean> {
  const safeName = assertSqlIdentifier(tableName);
  const rows = await client.$queryRawUnsafe<Array<{ name: string }>>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${safeName}'`,
  );

  return rows.length > 0;
}

export async function hasSqliteColumn(
  client: PrismaClient,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const safeTable = assertSqlIdentifier(tableName);
  const safeColumn = assertSqlIdentifier(columnName);
  const rows = await client.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("${safeTable}")`,
  );

  return rows.some((column) => column.name === safeColumn);
}
