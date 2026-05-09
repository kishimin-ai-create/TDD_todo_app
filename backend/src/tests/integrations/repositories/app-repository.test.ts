import { describe, it, expect, beforeEach } from 'vitest';

import type { AppRepository } from '../../../repositories/app-repository';
import { createInMemoryAppRepository } from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';
import type { AppEntity } from '../../../models/app';

const TIME = '2024-01-01T00:00:00.000Z';
const USER_ID = 'user-repo-test';

function makeApp(id: string, name: string, deletedAt: string | null = null): AppEntity {
  return { id, userId: USER_ID, name, createdAt: TIME, updatedAt: TIME, deletedAt };
}

describe('AppRepository contract', () => {
  let repo: AppRepository;

  beforeEach(() => {
    repo = createInMemoryAppRepository(createInMemoryStorage());
  });

  // ─── save + findActiveById ────────────────────────────────────────────────

  describe('save + findActiveById', () => {
    it('persisted entity is retrievable by id', async () => {
      await repo.save(makeApp('app-1', 'My App'));
      const found = await repo.findActiveById('app-1');
      expect(found?.id).toBe('app-1');
      expect(found?.name).toBe('My App');
    });

    it('returns null for an unknown id', async () => {
      expect(await repo.findActiveById('unknown')).toBeNull();
    });

    it('returns null for a soft-deleted entity', async () => {
      await repo.save(makeApp('app-1', 'Deleted', TIME));
      expect(await repo.findActiveById('app-1')).toBeNull();
    });

    it('overwriting with the same id updates the entity', async () => {
      await repo.save(makeApp('app-1', 'Original'));
      await repo.save(makeApp('app-1', 'Updated'));
      expect((await repo.findActiveById('app-1'))?.name).toBe('Updated');
    });

    it('returned entity is a defensive copy, not the original reference', async () => {
      const app = makeApp('app-1', 'Copy Test');
      await repo.save(app);
      const found = await repo.findActiveById('app-1');
      expect(found).not.toBe(app);
    });
  });

  // ─── listActiveByUserId ───────────────────────────────────────────────────

  describe('listActiveByUserId', () => {
    it('returns empty array when no entities exist for the user', async () => {
      expect(await repo.listActiveByUserId(USER_ID)).toEqual([]);
    });

    it('returns only active (non-deleted) entities for the user', async () => {
      await repo.save(makeApp('app-1', 'Active'));
      await repo.save(makeApp('app-2', 'Deleted', TIME));
      const list = await repo.listActiveByUserId(USER_ID);
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Active');
    });

    it('returns all active entities for the user', async () => {
      await repo.save(makeApp('app-1', 'A'));
      await repo.save(makeApp('app-2', 'B'));
      expect(await repo.listActiveByUserId(USER_ID)).toHaveLength(2);
    });

    it("does not include other users' apps", async () => {
      await repo.save(makeApp('app-1', 'Mine'));
      await repo.save({ ...makeApp('app-2', 'Theirs'), userId: 'other-user' });
      const list = await repo.listActiveByUserId(USER_ID);
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Mine');
    });
  });

  // ─── existsActiveByName ───────────────────────────────────────────────────

  describe('existsActiveByName', () => {
    it('returns true when an active entity with the given name exists for the user', async () => {
      await repo.save(makeApp('app-1', 'My App'));
      expect(await repo.existsActiveByName('My App', USER_ID)).toBe(true);
    });

    it('returns false when no entity with the name exists', async () => {
      expect(await repo.existsActiveByName('None', USER_ID)).toBe(false);
    });

    it('returns false when only a soft-deleted entity has the name', async () => {
      await repo.save(makeApp('app-1', 'Gone', TIME));
      expect(await repo.existsActiveByName('Gone', USER_ID)).toBe(false);
    });

    it('returns false when the only matching entity is excluded by id (self-check)', async () => {
      await repo.save(makeApp('app-1', 'Same Name'));
      expect(await repo.existsActiveByName('Same Name', USER_ID, 'app-1')).toBe(false);
    });

    it('returns true when another entity (not excluded by id) has the same name', async () => {
      await repo.save(makeApp('app-1', 'Shared'));
      await repo.save(makeApp('app-2', 'Shared'));
      expect(await repo.existsActiveByName('Shared', USER_ID, 'app-1')).toBe(true);
    });

    it("returns false when only another user's app has the name", async () => {
      await repo.save({ ...makeApp('app-1', 'Cross User'), userId: 'other-user' });
      expect(await repo.existsActiveByName('Cross User', USER_ID)).toBe(false);
    });
  });
});
