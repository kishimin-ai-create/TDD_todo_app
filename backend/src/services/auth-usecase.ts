import type { UserEntity } from '../models/user';

/**
 * Input type for registering a new user.
 */
export type RegisterInput = { email: string; password: string };

/**
 * Input type for logging in.
 */
export type LoginInput = { email: string; password: string };

/**
 * Output type for successful authentication.
 */
export type AuthOutput = { token: string; user: UserEntity };

/**
 * Use case interface for auth operations.
 */
export interface AuthUsecase {
  register(input: RegisterInput): Promise<AuthOutput>;
  login(input: LoginInput): Promise<AuthOutput>;
}
