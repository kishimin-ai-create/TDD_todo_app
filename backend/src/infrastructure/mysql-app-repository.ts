import type { RowDataPacket } from 'mysql2';
// eslint-disable-next-line no-console
const logError = (context: string, err: unknown) => console.error(`[mysql-app-repository] ${context}`, err);
import { AppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { AppRepository } from '../repositories/app-repository';
import type { MysqlPool } from './mysql-client';

type AppRow = RowDataPacket & {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type ExistsRow = RowDataPacket & {
  exists: number;
};

// ExistsRow is used by existsActiveByName below; save() uses ON DUPLICATE KEY UPDATE instead.

function rowToApp(row: AppRow): AppEntity {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

/**
 * Creates the MySQL implementation of the app repository port.
 */
export function createMysqlAppRepository(pool: MysqlPool): AppRepository {
  async function save(app: AppEntity): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO App (id, userId, name, createdAt, updatedAt, deletedAt)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           userId    = VALUES(userId),
           name      = VALUES(name),
           updatedAt = VALUES(updatedAt),
           deletedAt = VALUES(deletedAt)`,
        [app.id, app.userId, app.name, new Date(app.createdAt), new Date(app.updatedAt), app.deletedAt ? new Date(app.deletedAt) : null],
      );
    } catch (err: unknown) {
      logError('save', err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function listActiveByUserId(userId: string): Promise<AppEntity[]> {
    try {
      const [rows] = await pool.execute<AppRow[]>(
        'SELECT id, userId, name, createdAt, updatedAt, deletedAt FROM App WHERE userId = ? AND deletedAt IS NULL',
        [userId],
      );
      return rows.map(rowToApp);
    } catch (err: unknown) {
      logError('listActiveByUserId', err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function findActiveById(id: string): Promise<AppEntity | null> {
    try {
      const [rows] = await pool.execute<AppRow[]>(
        'SELECT id, userId, name, createdAt, updatedAt, deletedAt FROM App WHERE id = ? AND deletedAt IS NULL',
        [id],
      );
      const row = rows[0];
      return row ? rowToApp(row) : null;
    } catch (err: unknown) {
      logError('findActiveById', err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function existsActiveByName(name: string, userId: string, excludeId?: string): Promise<boolean> {
    try {
      if (excludeId !== undefined) {
        const [rows] = await pool.execute<ExistsRow[]>(
          'SELECT EXISTS(SELECT 1 FROM App WHERE name = ? AND userId = ? AND deletedAt IS NULL AND id != ?) AS `exists`',
          [name, userId, excludeId],
        );
        return rows[0].exists === 1;
      }
      const [rows] = await pool.execute<ExistsRow[]>(
        'SELECT EXISTS(SELECT 1 FROM App WHERE name = ? AND userId = ? AND deletedAt IS NULL) AS `exists`',
        [name, userId],
      );
      return rows[0].exists === 1;
    } catch (err: unknown) {
      logError('existsActiveByName', err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  return { save, listActiveByUserId, findActiveById, existsActiveByName };
}
