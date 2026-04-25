import { isAppError } from '../../domain/entities/app-error';
import type { AppUsecase } from '../../usecase/input_ports/app-usecase';
import {
  presentApp,
  presentError,
  presentSuccess,
  type JsonHttpResponse,
} from '../presenters/http-presenter';
import {
  parseCreateAppInput,
  parseUpdateAppInput,
} from './request-validation';

export type AppController = {
  create(body: unknown): Promise<JsonHttpResponse>;
  list(): Promise<JsonHttpResponse>;
  get(appId: string): Promise<JsonHttpResponse>;
  update(appId: string, body: unknown): Promise<JsonHttpResponse>;
  delete(appId: string): Promise<JsonHttpResponse>;
};

/**
 * Creates a thin controller for app-related HTTP actions.
 */
export function createAppController(appUsecase: AppUsecase): AppController {
  async function create(body: unknown): Promise<JsonHttpResponse> {
    try {
      const app = await appUsecase.create(parseCreateAppInput(body));
      return presentSuccess(presentApp(app), 201);
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function list(): Promise<JsonHttpResponse> {
    try {
      const apps = await appUsecase.list();
      return presentSuccess(apps.map(presentApp));
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function get(appId: string): Promise<JsonHttpResponse> {
    try {
      const app = await appUsecase.get({ appId });
      return presentSuccess(presentApp(app));
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function update(
    appId: string,
    body: unknown,
  ): Promise<JsonHttpResponse> {
    try {
      const app = await appUsecase.update(parseUpdateAppInput(appId, body));
      return presentSuccess(presentApp(app));
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function remove(appId: string): Promise<JsonHttpResponse> {
    try {
      const app = await appUsecase.delete({ appId });
      return presentSuccess(presentApp(app));
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
