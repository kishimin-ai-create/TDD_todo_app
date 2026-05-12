import { randomBytes, scryptSync } from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';

import { createInMemoryUserRepository } from '../../../infrastructure/in-memory-repositories';
import { createAuthInteractor } from '../../../services/auth-interactor';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Builds a scrypt-hashed password string in the expected "salt:hash" format.
 */
function buildScryptHash(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const key = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${key}`;
}

describe('AuthInteractor', () => {
  let userRepo: ReturnType<typeof createInMemoryUserRepository>;

  beforeEach(() => {
    userRepo = createInMemoryUserRepository();
  });

  // ─── signup ───────────────────────────────────────────────────────────────

  describe('signup', () => {
    it('stores a scrypt hash, not the raw password', async () => {
      const interactor = createAuthInteractor({ userRepository: userRepo });
      const password = 'myPassword1';

      await interactor.signup({ email: 'user@example.com', password });

      const stored = await userRepo.findByEmail('user@example.com');
      expect(stored).not.toBeNull();
      // The stored value must NOT equal the raw password
      expect(stored!.passwordHash).not.toBe(password);
      // It should contain a ":" separator (salt:hash format)
      expect(stored!.passwordHash).toContain(':');
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns user when raw password matches the stored scrypt hash', async () => {
      // Arrange — pre-seed a user whose passwordHash is a real scrypt hash
      const password = 'correctPassword1';
      await userRepo.save({
        id: 'pre-seeded-user-id',
        email: 'user@example.com',
        token: 'pre-seeded-token',
        passwordHash: buildScryptHash(password),
      });

      const interactor = createAuthInteractor({ userRepository: userRepo });

      // Act
      const result = await interactor.login({ email: 'user@example.com', password });

      // Assert
      expect(result.id).toBe('pre-seeded-user-id');
      expect(result.email).toBe('user@example.com');
    });

    it('throws UNAUTHORIZED when password does not match the stored scrypt hash', async () => {
      // Arrange
      const password = 'correctPassword1';
      await userRepo.save({
        id: 'pre-seeded-user-id',
        email: 'user@example.com',
        token: 'pre-seeded-token',
        passwordHash: buildScryptHash(password),
      });

      const interactor = createAuthInteractor({ userRepository: userRepo });

      // Act & Assert
      await expect(
        interactor.login({ email: 'user@example.com', password: 'wrongPassword' }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('succeeds when user signs up then logs in with the same credentials', async () => {
      const interactor = createAuthInteractor({ userRepository: userRepo });
      const email = 'roundtrip@example.com';
      const password = 'roundtripPass1';

      await interactor.signup({ email, password });
      const result = await interactor.login({ email, password });

      expect(result.email).toBe(email);
    });
  });
});
