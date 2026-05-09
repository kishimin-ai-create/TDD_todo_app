import type { AuthUsecase } from '../services/auth-usecase';
import {
  handleControllerError,
  presentSuccess,
  type JsonHttpResponse,
} from './http-presenter';
import { parseLoginInput, parseSignupInput } from './request-validation';

/**
 * Controller interface for authentication-related HTTP actions.
 */
export type AuthController = {
  /**
   * Registers a new user.
   */
  signup(body: unknown): Promise<JsonHttpResponse>;
  /**
   * Authenticates an existing user.
   */
  login(body: unknown): Promise<JsonHttpResponse>;
};

/**
 * Creates a thin controller for auth-related HTTP actions.
 */
export function createAuthController(authUsecase: AuthUsecase): AuthController {
  async function signup(body: unknown): Promise<JsonHttpResponse> {
    try {
      const result = await authUsecase.signup(parseSignupInput(body));
      return presentSuccess(result, 201);
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function login(body: unknown): Promise<JsonHttpResponse> {
    try {
      const result = await authUsecase.login(parseLoginInput(body));
      return presentSuccess(result);
    } catch (error) {
      return handleControllerError(error);
    }
  }

  return { signup, login };
}
