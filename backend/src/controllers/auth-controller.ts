import type { AuthUsecase } from '../services/auth-usecase';
import type { UserEntity } from '../models/user';
import {
  presentSuccess,
  handleControllerError,
  type JsonHttpResponse,
} from './http-presenter';
import { parseRegisterInput, parseLoginInput } from './request-validation';

type UserDto = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

function presentUser(user: UserEntity): UserDto {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export type AuthController = {
  /**
   * Registers a new user.
   */
  register(body: unknown): Promise<JsonHttpResponse>;
  /**
   * Logs in an existing user.
   */
  login(body: unknown): Promise<JsonHttpResponse>;
};

/**
 * Creates a thin controller for auth-related HTTP actions.
 */
export function createAuthController(authUsecase: AuthUsecase): AuthController {
  async function register(body: unknown): Promise<JsonHttpResponse> {
    try {
      const { token, user } = await authUsecase.register(parseRegisterInput(body));
      return presentSuccess({ token, user: presentUser(user) }, 201);
    } catch (error) {
      return handleControllerError(error);
    }
  }

  async function login(body: unknown): Promise<JsonHttpResponse> {
    try {
      const { token, user } = await authUsecase.login(parseLoginInput(body));
      return presentSuccess({ token, user: presentUser(user) });
    } catch (error) {
      return handleControllerError(error);
    }
  }

  return { register, login };
}
