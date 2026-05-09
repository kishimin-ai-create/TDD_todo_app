import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { AppError } from '../models/app-error';
import type { UserRepository } from '../repositories/user-repository';
import type { AuthUsecase, LoginInput, RegisterInput, AuthOutput } from './auth-usecase';

const scryptAsync = promisify(scrypt);

type AuthInteractorDependencies = {
  userRepository: UserRepository;
  generateId?: () => string;
  now?: () => string;
  signToken: (userId: string, email: string) => Promise<string>;
};

/**
 * Hashes a plain-text password using scrypt with a random salt.
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Verifies a plain-text password against a stored hash.
 */
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [hashHex, salt] = stored.split('.');
  if (!hashHex || !salt) return false;
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (buf.length !== storedBuf.length) return false;
  return timingSafeEqual(buf, storedBuf);
}

/**
 * Creates the auth use case interactor and wires its dependencies.
 */
export function createAuthInteractor(
  dependencies: AuthInteractorDependencies,
): AuthUsecase {
  const userRepository = dependencies.userRepository;
  const generateId = dependencies.generateId ?? (() => crypto.randomUUID());
  const now = dependencies.now ?? (() => new Date().toISOString());
  const signToken = dependencies.signToken;

  async function register(input: RegisterInput): Promise<AuthOutput> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new AppError('CONFLICT', 'Email already registered');
    const passwordHash = await hashPassword(input.password);
    const timestamp = now();
    const user = {
      id: generateId(),
      email: input.email,
      passwordHash,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await userRepository.save(user);
    const token = await signToken(user.id, user.email);
    return { token, user };
  }

  async function login(input: LoginInput): Promise<AuthOutput> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new AppError('UNAUTHORIZED', 'Invalid email or password');
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw new AppError('UNAUTHORIZED', 'Invalid email or password');
    const token = await signToken(user.id, user.email);
    return { token, user };
  }

  return { register, login };
}
