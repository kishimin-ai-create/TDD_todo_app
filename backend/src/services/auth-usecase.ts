/**
 * Input for user signup.
 */
export type SignupInput = {
  email: string;
  password: string;
};

/**
 * Input for user login.
 */
export type LoginInput = {
  email: string;
  password: string;
};

/**
 * Result returned after successful signup or login.
 */
export type AuthResult = {
  userId: string;
  email: string;
};

/**
 * Use case interface for authentication operations.
 */
export interface AuthUsecase {
  signup(input: SignupInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
}
