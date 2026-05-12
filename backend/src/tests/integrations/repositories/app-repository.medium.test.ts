import { describe, it, expect, beforeEach } from 'vitest';

import type { AppRepository } from '../../../repositories/app-repository';
import { createInMemoryAppRepository } from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import type { AppEntity } from '../../../models/app';

const TIME = '2024-01-01T00:00:00.000Z';

function makeApp(id: string, userId: string, name: string, deletedAt: string | null = null): AppEntity {
  return { id, userId, name, createdAt: TIME, updatedAt: TIME, deletedAt };
}

describe('AppRepository contract', () => {
  let repo: AppRepository;

  beforeEach(() => {
    repo = createInMemoryAppRepository(createInMemoryStorage());
  });

  it('persisted entity is retrievable by id', async () => {
    await repo.save(makeApp('app-1', 'user-1', 'My App'));
    const found = await repo.findActiveById('app-1');
    expect(found?.id).toBe('app-1');
    expect(found?.userId).toBe('user-1');
  });

  it('listActiveByUserId returns only active apps for the owner', async () => {
    await repo.save(makeApp('app-1', 'user-1', 'A'));
    await repo.save(makeApp('app-2', 'user-2', 'B'));
    await repo.save(makeApp('app-3', 'user-1', 'Deleted', TIME));
    const list = await repo.listActiveByUserId('user-1');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('app-1');
  });

  it('existsActiveByName scopes uniqueness to a user', async () => {
    await repo.save(makeApp('app-1', 'user-1', 'Shared'));
    await repo.save(makeApp('app-2', 'user-2', 'Shared'));
    expect(await repo.existsActiveByName('Shared', 'user-1')).toBe(true);
    expect(await repo.existsActiveByName('Shared', 'user-2')).toBe(true);
    expect(await repo.existsActiveByName('Shared', 'user-3')).toBe(false);
  });

  it('existsActiveByName supports excluding the current app id', async () => {
    await repo.save(makeApp('app-1', 'user-1', 'Same Name'));
    expect(await repo.existsActiveByName('Same Name', 'user-1', 'app-1')).toBe(false);
  });
});
