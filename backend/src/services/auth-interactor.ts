import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import { AppError } from '../models/app-error';
import type { UserRepository } from '../repositories/user-repository';
import type { AuthOutput, AuthUsecase, LoginInput, SignupInput } from './auth-usecase';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Hashes a plain-text password using scrypt and returns a "salt:hash" string.
 * @param {string} password The plain-text password to hash
 * @returns {string} The hashed password in "salt:hash" format
 */
function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const key = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${key}`;
}

/**
 * Verifies a plain-text password against a stored "salt:hash" string.
 * Uses timingSafeEqual to prevent timing-based side-channel attacks.
 * @param {string} password The plain-text password to verify
 * @param {string} storedHash The stored "salt:hash" string
 * @returns {boolean} true if the password matches, false otherwise
 */
function verifyPassword(password: string, storedHash: string): boolean {
  const separatorIndex = storedHash.indexOf(':');
  if (separatorIndex === -1) return false;
  const salt = storedHash.slice(0, separatorIndex);
  const key = storedHash.slice(separatorIndex + 1);
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(keyBuffer, derivedKey);
}

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
      passwordHash: hashPassword(input.password),
    };
    await userRepository.save(user);
    return { id: user.id, email: user.email, token: user.token };
  }

  async function login(input: LoginInput): Promise<AuthOutput> {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password.');
    }
    return { id: user.id, email: user.email, token: user.token };
  }

  return { signup, login };
}
