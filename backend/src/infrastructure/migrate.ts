/* eslint-disable no-console */

import { createConnection } from 'mysql2/promise';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RowDataPacket } from 'mysql2';

type MigrationRow = RowDataPacket & { name: string };

/**
 * Runs pending SQL migration files against the configured MySQL database.
 */
async function migrate(): Promise<void> {
  const dbName = process.env.DB_DATABASE ?? 'TDDTodoAppDB';

  if (!/^\w+$/.test(dbName)) {
    throw new Error(`Invalid DB_DATABASE value: "${dbName}"`);
  }

  const connection = await createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? '3306'),
    user: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    timezone: '+00:00',
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${dbName}\``);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id        INT          NOT NULL AUTO_INCREMENT,
        name      VARCHAR(255) NOT NULL,
        appliedAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE INDEX idx_migrations_name (name)
      ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    const migrationsDir = fileURLToPath(new URL('../../migrations', import.meta.url));
    const allFiles = await readdir(migrationsDir);
    const sqlFiles = allFiles.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      const [rows] = await connection.execute<MigrationRow[]>(
        'SELECT name FROM _migrations WHERE name = ?',
        [file],
      );

      if (rows.length > 0) {
        console.log(`  skip   ${file}`);
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), 'utf-8');
      await connection.query(sql);
      await connection.execute(
        'INSERT INTO _migrations (name) VALUES (?)',
        [file],
      );
      console.log(`  apply  ${file}`);
    }

    console.log('Migration complete.');
  } finally {
    await connection.end();
  }
}

migrate().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
