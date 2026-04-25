import type { RowDataPacket } from 'mysql2';
import { AppError } from '../models/app-error';
import type { TodoEntity } from '../models/todo';
import type { TodoRepository } from '../repositories/todo-repository';
import type { MysqlPool } from './mysql-client';

type TodoRow = RowDataPacket & {
  id: string;
  appId: string;
  title: string;
  completed: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

function rowToTodo(row: TodoRow): TodoEntity {
  return {
    id: row.id,
    appId: row.appId,
    title: row.title,
    completed: row.completed !== 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

/**
 * Creates the MySQL implementation of the todo repository port.
 */
export function createMysqlTodoRepository(pool: MysqlPool): TodoRepository {
  async function save(todo: TodoEntity): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO Todo (id, appId, title, completed, createdAt, updatedAt, deletedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title     = VALUES(title),
           completed = VALUES(completed),
           updatedAt = VALUES(updatedAt),
           deletedAt = VALUES(deletedAt)`,
        [todo.id, todo.appId, todo.title, todo.completed, todo.createdAt, todo.updatedAt, todo.deletedAt],
      );
    } catch {
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed');
    }
  }

  async function listActiveByAppId(appId: string): Promise<TodoEntity[]> {
    try {
      const [rows] = await pool.execute<TodoRow[]>(
        'SELECT id, appId, title, completed, createdAt, updatedAt, deletedAt FROM Todo WHERE appId = ? AND deletedAt IS NULL',
        [appId],
      );
      return rows.map(rowToTodo);
    } catch {
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed');
    }
  }

  async function findActiveById(appId: string, todoId: string): Promise<TodoEntity | null> {
    try {
      const [rows] = await pool.execute<TodoRow[]>(
        'SELECT id, appId, title, completed, createdAt, updatedAt, deletedAt FROM Todo WHERE id = ? AND appId = ? AND deletedAt IS NULL',
        [todoId, appId],
      );
      const row = rows[0];
      return row ? rowToTodo(row) : null;
    } catch {
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed');
    }
  }

  return { save, listActiveByAppId, findActiveById };
}
