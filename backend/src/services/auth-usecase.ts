/**
 * Input type for signing up a new user.
 */
export type SignupInput = { email: string; password: string };

/**
 * Input type for logging in an existing user.
 */
export type LoginInput = { email: string; password: string };

/**
 * Output type for successful authentication operations.
 */
export type AuthOutput = { id: string; email: string; token: string };

/**
 * Use case interface for authentication operations.
 */
export interface AuthUsecase {
  signup(input: SignupInput): Promise<AuthOutput>;
  login(input: LoginInput): Promise<AuthOutput>;
}
