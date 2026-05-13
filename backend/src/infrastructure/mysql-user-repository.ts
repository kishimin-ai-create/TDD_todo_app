import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import { AppError } from '../models/app-error';
import type { UserEntity } from '../models/user';
import type { UserRepository } from '../repositories/user-repository';
import type { Database } from './db';

function rowToUser(row: {
  id: string;
  email: string;
  token: string;
  passwordHash: string;
  createdAt: Date;
}): UserEntity {
  return {
    id: row.id,
    email: row.email,
    token: row.token,
    passwordHash: row.passwordHash,
  };
}

/**
 * Creates the MySQL implementation of the user repository port.
 */
export function createMysqlUserRepository(db: Kysely<Database>): UserRepository {
  async function findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const row = await db
        .selectFrom('users')
        .selectAll()
        .where('email', '=', email)
        .executeTakeFirst();
      return row ? rowToUser(row) : null;
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(`[mysql-user-repository] findByEmail`, err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function findByToken(token: string): Promise<UserEntity | null> {
    try {
      const row = await db
        .selectFrom('users')
        .selectAll()
        .where('token', '=', token)
        .executeTakeFirst();
      return row ? rowToUser(row) : null;
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(`[mysql-user-repository] findByToken`, err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function save(user: UserEntity): Promise<void> {
    try {
      await db
        .insertInto('users')
        .values({
          id: user.id,
          email: user.email,
          token: user.token,
          passwordHash: user.passwordHash,
          createdAt: new Date(),
        })
        .onDuplicateKeyUpdate({
          email: sql`VALUES(email)`,
          token: sql`VALUES(token)`,
          passwordHash: sql`VALUES(passwordHash)`,
        })
        .execute();
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(`[mysql-user-repository] save`, err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  return { findByEmail, findByToken, save };
}
