import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import { AppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { AppRepository } from '../repositories/app-repository';
import type { Database } from './db';

function rowToApp(row: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): AppEntity {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

/**
 * Creates the MySQL implementation of the app repository port.
 */
export function createMysqlAppRepository(db: Kysely<Database>): AppRepository {
  async function save(app: AppEntity): Promise<void> {
    try {
      await db
        .insertInto('App')
        .values({
          id: app.id,
          name: app.name,
          createdAt: new Date(app.createdAt),
          updatedAt: new Date(app.updatedAt),
          deletedAt: app.deletedAt ? new Date(app.deletedAt) : null,
        })
        .onDuplicateKeyUpdate({
          name: sql`VALUES(name)`,
          updatedAt: sql`VALUES(updatedAt)`,
          deletedAt: sql`VALUES(deletedAt)`,
        })
        .execute();
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(`[mysql-app-repository] save`, err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function listActive(): Promise<AppEntity[]> {
    try {
      const rows = await db
        .selectFrom('App')
        .selectAll()
        .where('deletedAt', 'is', null)
        .execute();
      return rows.map(rowToApp);
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(`[mysql-app-repository] listActive`, err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function findActiveById(id: string): Promise<AppEntity | null> {
    try {
      const row = await db
        .selectFrom('App')
        .selectAll()
        .where('id', '=', id)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();
      return row ? rowToApp(row) : null;
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(`[mysql-app-repository] findActiveById`, err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function existsActiveByName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const result = await db
        .selectFrom('App')
        .select(({ fn }) => fn.count<number>('id').as('count'))
        .where('name', '=', name)
        .where('deletedAt', 'is', null)
        .$if(excludeId !== undefined, qb => qb.where('id', '!=', excludeId!))
        .executeTakeFirst();
      return Number(result?.count ?? 0) > 0;
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(`[mysql-app-repository] existsActiveByName`, err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  return { save, listActive, findActiveById, existsActiveByName };
}
