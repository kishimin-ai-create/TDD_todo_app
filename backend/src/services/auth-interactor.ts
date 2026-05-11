import { AppError } from '../models/app-error';
import type { UserRepository } from '../repositories/user-repository';
import type { AuthOutput, AuthUsecase, LoginInput, SignupInput } from './auth-usecase';

type AuthInteractorDependencies = {
  userRepository: UserRepository;
  generateId?: () => string;
};

/**
 * Creates the auth use case interactor and wires its dependencies.
 */
export function createAuthInteractor(
  dependencies: AuthInteractorDependencies,
): AuthUsecase {
  const userRepository = dependencies.userRepository;
  const generateId = dependencies.generateId ?? (() => crypto.randomUUID());

  async function signup(input: SignupInput): Promise<AuthOutput> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('CONFLICT', 'This email address is already registered.');
    }
    const user = {
      id: generateId(),
      email: input.email,
      token: generateId(),
      passwordHash: input.password,
    };
    await userRepository.save(user);
    return { id: user.id, email: user.email, token: user.token };
  }

  async function login(input: LoginInput): Promise<AuthOutput> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password.');
    }
    if (user.passwordHash !== input.password) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password.');
    }
    return { id: user.id, email: user.email, token: user.token };
  }

  return { signup, login };
}
