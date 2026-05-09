import type { RowDataPacket } from 'mysql2';

// eslint-disable-next-line no-console
const logError = (context: string, err: unknown) => console.error(`[mysql-user-repository] ${context}`, err);
import { AppError } from '../models/app-error';
import type { UserEntity } from '../models/user';
import type { UserRepository } from '../repositories/user-repository';
import type { MysqlPool } from './mysql-client';

type UserRow = RowDataPacket & {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

function rowToUser(row: UserRow): UserEntity {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Creates the MySQL implementation of the user repository port.
 */
export function createMysqlUserRepository(pool: MysqlPool): UserRepository {
  async function save(user: UserEntity): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO User (id, email, passwordHash, createdAt)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           email        = VALUES(email),
           passwordHash = VALUES(passwordHash)`,
        [user.id, user.email, user.passwordHash, new Date(user.createdAt)],
      );
    } catch (err: unknown) {
      logError('save', err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const [rows] = await pool.execute<UserRow[]>(
        'SELECT id, email, passwordHash, createdAt FROM User WHERE email = ?',
        [email],
      );
      const row = rows[0];
      return row ? rowToUser(row) : null;
    } catch (err: unknown) {
      logError('findByEmail', err);
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  return { save, findByEmail };
}
