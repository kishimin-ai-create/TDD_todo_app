import { AppError } from '../models/app-error';
import type { UserEntity } from '../models/user';
import type { UserRepository } from '../repositories/user-repository';
import type { InMemoryStorage } from './in-memory-storage';

/**
 * Creates the in-memory implementation of the user repository port.
 */
export function createInMemoryUserRepository(
  storage: InMemoryStorage,
): UserRepository {
  function save(user: UserEntity): Promise<void> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        storage.users.set(user.id, { ...user });
      }),
    );
  }

  function findByEmail(email: string): Promise<UserEntity | null> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        for (const user of storage.users.values()) {
          if (user.email === email) return { ...user };
        }
        return null;
      }),
    );
  }

  function findById(id: string): Promise<UserEntity | null> {
    return Promise.resolve().then(() =>
      withRepositoryError(() => {
        const user = storage.users.get(id);
        return user ? { ...user } : null;
      }),
    );
  }

  return { save, findByEmail, findById };
}

function withRepositoryError<T>(operation: () => T): T {
  try {
    return operation();
  } catch {
    throw new AppError('REPOSITORY_ERROR', 'Repository operation failed');
  }
}
