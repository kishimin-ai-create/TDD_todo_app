import { createHash } from 'node:crypto';

import { AppError } from '../models/app-error';
import type { UserEntity } from '../models/user';
import type { UserRepository } from '../repositories/user-repository';
import type { AuthUsecase, LoginInput, SignupInput, AuthResult } from './auth-usecase';

type AuthInteractorDependencies = {
  userRepository: UserRepository;
  generateId?: () => string;
  now?: () => string;
};

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Creates the auth use case interactor and wires its dependencies.
 */
export function createAuthInteractor(
  dependencies: AuthInteractorDependencies,
): AuthUsecase {
  const { userRepository } = dependencies;
  const generateId = dependencies.generateId ?? (() => crypto.randomUUID());
  const now = dependencies.now ?? (() => new Date().toISOString());

  async function signup(input: SignupInput): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new AppError('CONFLICT', 'Email already registered');
    const user: UserEntity = {
      id: generateId(),
      email: input.email,
      passwordHash: hashPassword(input.password),
      createdAt: now(),
    };
    await userRepository.save(user);
    return { userId: user.id, email: user.email };
  }

  async function login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user || user.passwordHash !== hashPassword(input.password)) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password');
    }
    return { userId: user.id, email: user.email };
  }

  return { signup, login };
}
