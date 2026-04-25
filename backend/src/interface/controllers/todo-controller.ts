import { isAppError } from '../../domain/entities/app-error';
import type { TodoUsecase } from '../../usecase/input_ports/todo-usecase';
import {
  presentError,
  presentSuccess,
  presentTodo,
  type JsonHttpResponse,
} from '../presenters/http-presenter';
import {
  parseCreateTodoInput,
  parseUpdateTodoInput,
} from './request-validation';

export type TodoController = {
  create(appId: string, body: unknown): Promise<JsonHttpResponse>;
  list(appId: string): Promise<JsonHttpResponse>;
  get(appId: string, todoId: string): Promise<JsonHttpResponse>;
  update(
    appId: string,
    todoId: string,
    body: unknown,
  ): Promise<JsonHttpResponse>;
  delete(appId: string, todoId: string): Promise<JsonHttpResponse>;
};

/**
 * Creates a thin controller for todo-related HTTP actions.
 */
export function createTodoController(todoUsecase: TodoUsecase): TodoController {
  async function create(
    appId: string,
    body: unknown,
  ): Promise<JsonHttpResponse> {
    try {
      const todo = await todoUsecase.create(parseCreateTodoInput(appId, body));
      return presentSuccess(presentTodo(todo), 201);
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function list(appId: string): Promise<JsonHttpResponse> {
    try {
      const todos = await todoUsecase.list({ appId });
      return presentSuccess(todos.map(presentTodo));
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function get(appId: string, todoId: string): Promise<JsonHttpResponse> {
    try {
      const todo = await todoUsecase.get({ appId, todoId });
      return presentSuccess(presentTodo(todo));
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function update(
    appId: string,
    todoId: string,
    body: unknown,
  ): Promise<JsonHttpResponse> {
    try {
      const todo = await todoUsecase.update(
        parseUpdateTodoInput(appId, todoId, body),
      );
      return presentSuccess(presentTodo(todo));
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function remove(
    appId: string,
    todoId: string,
  ): Promise<JsonHttpResponse> {
    try {
      const todo = await todoUsecase.delete({ appId, todoId });
      return presentSuccess(presentTodo(todo));
    } catch (error) {
      return handleControllerError(error);
    }
  }

  return {
    create,
    list,
    get,
    update,
    delete: remove,
  };
}

function handleControllerError(error: unknown): JsonHttpResponse {
  if (isAppError(error)) {
    return presentError(error);
  }

  throw error;
}
