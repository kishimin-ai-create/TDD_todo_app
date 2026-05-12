import type { TodoEntity } from '../models/todo';

/**
 * Input type for creating a todo.
 */
export type CreateTodoInput = { appId: string; title: string; userId: string };
/**
 * Input for listing todos.
 */
export type ListTodosInput = { appId: string; userId: string };
/**
 * Input for retrieving a todo.
 */
export type GetTodoInput = { appId: string; todoId: string; userId: string };
/**
 * Input for updating a todo.
 */
export type UpdateTodoInput = {
  appId: string;
  todoId: string;
  userId: string;
  title?: string;
  completed?: boolean;
};
/**
 * Input for deleting a todo.
 */
export type DeleteTodoInput = { appId: string; todoId: string; userId: string };

/**
 * Use case interface for todo operations.
 */
export interface TodoUsecase {
  create(input: CreateTodoInput): Promise<TodoEntity>;
  list(input: ListTodosInput): Promise<TodoEntity[]>;
  get(input: GetTodoInput): Promise<TodoEntity>;
  update(input: UpdateTodoInput): Promise<TodoEntity>;
  delete(input: DeleteTodoInput): Promise<TodoEntity>;
}
