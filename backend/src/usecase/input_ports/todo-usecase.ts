import type { TodoEntity } from '../../domain/entities/todo';

export type CreateTodoInput = {
  appId: string;
  title: string;
};

export type ListTodosInput = {
  appId: string;
};

export type GetTodoInput = {
  appId: string;
  todoId: string;
};

export type UpdateTodoInput = {
  appId: string;
  todoId: string;
  title?: string;
  completed?: boolean;
};

export type DeleteTodoInput = {
  appId: string;
  todoId: string;
};

export interface TodoUsecase {
  create(input: CreateTodoInput): Promise<TodoEntity>;
  list(input: ListTodosInput): Promise<TodoEntity[]>;
  get(input: GetTodoInput): Promise<TodoEntity>;
  update(input: UpdateTodoInput): Promise<TodoEntity>;
  delete(input: DeleteTodoInput): Promise<TodoEntity>;
}
