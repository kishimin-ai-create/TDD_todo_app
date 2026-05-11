import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import { AppError } from '../models/app-error';
import type { TodoEntity } from '../models/todo';
import type { TodoRepository } from '../repositories/todo-repository';
import type { Database } from './db';

function rowToTodo(row: {
  id: string;
  appId: string;
  title: string;
  completed: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): TodoEntity {
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
export function createMysqlTodoRepository(db: Kysely<Database>): TodoRepository {
  async function save(todo: TodoEntity): Promise<void> {
    try {
      await db
        .insertInto('Todo')
        .values({
          id: todo.id,
          appId: todo.appId,
          title: todo.title,
          completed: todo.completed ? 1 : 0,
          createdAt: new Date(todo.createdAt),
          updatedAt: new Date(todo.updatedAt),
          deletedAt: todo.deletedAt ? new Date(todo.deletedAt) : null,
        })
        .onDuplicateKeyUpdate({
          title: sql`VALUES(title)`,
          completed: sql`VALUES(completed)`,
          updatedAt: sql`VALUES(updatedAt)`,
          deletedAt: sql`VALUES(deletedAt)`,
        })
        .execute();
    } catch (err: unknown) {
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function listActiveByAppId(appId: string): Promise<TodoEntity[]> {
    try {
      const rows = await db
        .selectFrom('Todo')
        .selectAll()
        .where('appId', '=', appId)
        .where('deletedAt', 'is', null)
        .execute();
      return rows.map(rowToTodo);
    } catch (err: unknown) {
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  async function findActiveById(appId: string, todoId: string): Promise<TodoEntity | null> {
    try {
      const row = await db
        .selectFrom('Todo')
        .selectAll()
        .where('id', '=', todoId)
        .where('appId', '=', appId)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();
      return row ? rowToTodo(row) : null;
    } catch (err: unknown) {
      throw new AppError('REPOSITORY_ERROR', 'Repository operation failed', { cause: err });
    }
  }

  return { save, listActiveByAppId, findActiveById };
}
