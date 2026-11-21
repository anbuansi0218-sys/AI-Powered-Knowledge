import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, sql, disconnectDatabase } from '../src/db/mssql.js';

const migrationsDirectory = fileURLToPath(new URL('../migrations/', import.meta.url));

async function migrate() {
  const pool = await getPool();
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.__app_migrations', N'U') IS NULL
    BEGIN
      CREATE TABLE [dbo].[__app_migrations] (
        [migration_name] NVARCHAR(255) NOT NULL PRIMARY KEY,
        [applied_at] DATETIME2(0) NOT NULL CONSTRAINT [__app_migrations_applied_at_df]
          DEFAULT (SYSUTCDATETIME())
      );
    END;
  `);

  const appliedResult = await pool.request().query(
    'SELECT migration_name FROM dbo.__app_migrations;'
  );
  const applied = new Set(appliedResult.recordset.map((row) => row.migration_name));
  const entries = (await readdir(migrationsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const migrationName of entries) {
    if (applied.has(migrationName)) continue;
    const migrationPath = path.join(migrationsDirectory, migrationName, 'up.sql');
    const migrationSql = await readFile(migrationPath, 'utf8');
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await new sql.Request(transaction).batch(migrationSql);
      await new sql.Request(transaction)
        .input('migrationName', sql.NVarChar(255), migrationName)
        .query('INSERT INTO dbo.__app_migrations (migration_name) VALUES (@migrationName);');
      await transaction.commit();
      console.log(`Applied migration ${migrationName}.`);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to apply migration ${migrationName}.`, { cause: error });
    }
  }
}

try {
  await migrate();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
