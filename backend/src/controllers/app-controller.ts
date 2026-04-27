import type { AppUsecase } from '../services/app-usecase';
import {
  presentApp,
  presentSuccess,
  handleControllerError,
  type JsonHttpResponse,
} from './http-presenter';
import { parseCreateAppInput, parseUpdateAppInput } from './request-validation';

export type AppController = {
  /**
   * Creates a new app.
   */
  create(body: unknown): Promise<JsonHttpResponse>;
  /**
   * Lists all apps.
   */
  list(): Promise<JsonHttpResponse>;
  /**
   * Retrieves an app by ID.
   */
  get(appId: string): Promise<JsonHttpResponse>;
  /**
   * Updates an app.
   */
  update(appId: string, body: unknown): Promise<JsonHttpResponse>;
  /**
   * Deletes an app.
   */
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
