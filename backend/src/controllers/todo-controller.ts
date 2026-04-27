import type { TodoUsecase } from '../services/todo-usecase';
import {
  presentSuccess,
  presentTodo,
  handleControllerError,
  type JsonHttpResponse,
} from './http-presenter';
import {
  parseCreateTodoInput,
  parseUpdateTodoInput,
} from './request-validation';

export type TodoController = {
  /**
   * Creates a new todo.
   */
  create(appId: string, body: unknown): Promise<JsonHttpResponse>;
  /**
   * Lists todos.
   */
  list(appId: string): Promise<JsonHttpResponse>;
  /**
   * Retrieves a todo by ID.
   */
  get(appId: string, todoId: string): Promise<JsonHttpResponse>;
  /**
   * Updates a todo.
   */
  update(appId: string, todoId: string, body: unknown): Promise<JsonHttpResponse>;
  /**
   * Deletes a todo.
   */
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
