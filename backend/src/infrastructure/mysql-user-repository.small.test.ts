import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../models/app-error';
import type { UserEntity } from '../models/user';
import { createMysqlUserRepository } from './mysql-user-repository';

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    token: 'token-abc',
    passwordHash: 'hash-xyz',
    ...overrides,
  };
}

function makeMockDb() {
  const executeTakeFirst = vi.fn();
  const execute = vi.fn();
  const onDuplicateKeyUpdate = vi.fn(() => ({ execute }));
  const values = vi.fn(() => ({ onDuplicateKeyUpdate }));
  const insertInto = vi.fn(() => ({ values }));
  const where2 = vi.fn(() => ({ executeTakeFirst }));
  const where1 = vi.fn(() => ({ where: where2, executeTakeFirst }));
  const selectAll = vi.fn(() => ({ where: where1 }));
  const selectFrom = vi.fn(() => ({ selectAll }));

  return {
    db: { selectFrom, insertInto } as unknown as Parameters<
      typeof createMysqlUserRepository
    >[0],
    mocks: { selectFrom, selectAll, where1, where2, executeTakeFirst, insertInto, values, onDuplicateKeyUpdate, execute },
  };
}

describe('createMysqlUserRepository', () => {
  describe('findByEmail', () => {
    it('returns null when no row is found', async () => {
      const { db, mocks } = makeMockDb();
      mocks.executeTakeFirst.mockResolvedValue(undefined);
      const repo = createMysqlUserRepository(db);
      const result = await repo.findByEmail('missing@example.com');
      expect(result).toBeNull();
    });

    it('returns a UserEntity when a row is found', async () => {
      const { db, mocks } = makeMockDb();
      const user = makeUser();
      mocks.executeTakeFirst.mockResolvedValue({ ...user, createdAt: new Date() });
      const repo = createMysqlUserRepository(db);
      const result = await repo.findByEmail(user.email);
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        token: user.token,
        passwordHash: user.passwordHash,
      });
    });

    it('throws AppError with REPOSITORY_ERROR when DB throws', async () => {
      const { db, mocks } = makeMockDb();
      mocks.executeTakeFirst.mockRejectedValue(new Error('db down'));
      const repo = createMysqlUserRepository(db);
      await expect(repo.findByEmail('any@example.com')).rejects.toBeInstanceOf(AppError);
      await expect(repo.findByEmail('any@example.com')).rejects.toMatchObject({
        code: 'REPOSITORY_ERROR',
      });
    });
  });

  describe('findByToken', () => {
    it('returns null when no row is found', async () => {
      const { db, mocks } = makeMockDb();
      mocks.executeTakeFirst.mockResolvedValue(undefined);
      const repo = createMysqlUserRepository(db);
      const result = await repo.findByToken('no-such-token');
      expect(result).toBeNull();
    });

    it('returns a UserEntity when a row is found', async () => {
      const { db, mocks } = makeMockDb();
      const user = makeUser();
      mocks.executeTakeFirst.mockResolvedValue({ ...user, createdAt: new Date() });
      const repo = createMysqlUserRepository(db);
      const result = await repo.findByToken(user.token);
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        token: user.token,
        passwordHash: user.passwordHash,
      });
    });

    it('throws AppError with REPOSITORY_ERROR when DB throws', async () => {
      const { db, mocks } = makeMockDb();
      mocks.executeTakeFirst.mockRejectedValue(new Error('db down'));
      const repo = createMysqlUserRepository(db);
      await expect(repo.findByToken('any-token')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('save', () => {
    it('calls insertInto with correct values', async () => {
      const { db, mocks } = makeMockDb();
      mocks.execute.mockResolvedValue(undefined);
      const repo = createMysqlUserRepository(db);
      const user = makeUser();
      await repo.save(user);
      expect(mocks.insertInto).toHaveBeenCalledWith('users');
      expect(mocks.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: user.id,
          email: user.email,
          token: user.token,
          passwordHash: user.passwordHash,
        }),
      );
    });

    it('throws AppError with REPOSITORY_ERROR when DB throws', async () => {
      const { db, mocks } = makeMockDb();
      mocks.execute.mockRejectedValue(new Error('db down'));
      const repo = createMysqlUserRepository(db);
      await expect(repo.save(makeUser())).rejects.toBeInstanceOf(AppError);
      await expect(repo.save(makeUser())).rejects.toMatchObject({
        code: 'REPOSITORY_ERROR',
      });
    });
  });
});
