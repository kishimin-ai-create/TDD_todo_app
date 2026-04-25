import { AppError } from '../models/app-error';
import type { AppEntity } from '../models/app';
import type { TodoEntity } from '../models/todo';
import type { AppRepository } from '../repositories/app-repository';
import type { TodoRepository } from '../repositories/todo-repository';
import type {
  TodoUsecase,
  CreateTodoInput,
  DeleteTodoInput,
  GetTodoInput,
  ListTodosInput,
  UpdateTodoInput,
} from './todo-usecase';

type TodoInteractorDependencies = {
  appRepository: AppRepository;
  todoRepository: TodoRepository;
  generateId?: () => string;
  now?: () => string;
};

/**
 * Creates the todo use case interactor and wires its dependencies.
 */
export function createTodoInteractor(
  dependencies: TodoInteractorDependencies,
): TodoUsecase {
  const appRepository = dependencies.appRepository;
  const todoRepository = dependencies.todoRepository;
  const generateId = dependencies.generateId ?? (() => crypto.randomUUID());
  const now = dependencies.now ?? (() => new Date().toISOString());

  async function ensureAppExists(appId: string): Promise<AppEntity> {
    const app = await appRepository.findActiveById(appId);
    if (!app) throw new AppError('NOT_FOUND', 'App not found');
    return app;
  }

  async function findExistingTodo(
    appId: string,
    todoId: string,
  ): Promise<TodoEntity> {
    const todo = await todoRepository.findActiveById(appId, todoId);
    if (!todo) throw new AppError('NOT_FOUND', 'Todo not found');
    return todo;
  }

  async function create(input: CreateTodoInput): Promise<TodoEntity> {
    await ensureAppExists(input.appId);
    const timestamp = now();
    const todo: TodoEntity = {
      id: generateId(),
      appId: input.appId,
      title: input.title,
      completed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };
    await todoRepository.save(todo);
    return todo;
  }

  async function list(input: ListTodosInput): Promise<TodoEntity[]> {
    await ensureAppExists(input.appId);
    return todoRepository.listActiveByAppId(input.appId);
  }

  async function get(input: GetTodoInput): Promise<TodoEntity> {
    await ensureAppExists(input.appId);
    return findExistingTodo(input.appId, input.todoId);
  }

  async function update(input: UpdateTodoInput): Promise<TodoEntity> {
    await ensureAppExists(input.appId);
    const todo = await findExistingTodo(input.appId, input.todoId);
    const updatedTodo: TodoEntity = {
      ...todo,
      title: input.title ?? todo.title,
      completed: input.completed ?? todo.completed,
      updatedAt: now(),
    };
    await todoRepository.save(updatedTodo);
    return updatedTodo;
  }

  async function remove(input: DeleteTodoInput): Promise<TodoEntity> {
    await ensureAppExists(input.appId);
    const todo = await findExistingTodo(input.appId, input.todoId);
    const deletedTodo: TodoEntity = { ...todo, deletedAt: now() };
    await todoRepository.save(deletedTodo);
    return deletedTodo;
  }

  return { create, list, get, update, delete: remove };
}
