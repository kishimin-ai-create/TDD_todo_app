import type { AppEntity } from '../models/app';

/**
 * Interface for app persistence operations.
 */
export interface AppRepository {
  save(app: AppEntity): Promise<void>;
  listActiveByUserId(userId: string): Promise<AppEntity[]>;
  findActiveById(id: string): Promise<AppEntity | null>;
  existsActiveByName(name: string, userId: string, excludeId?: string): Promise<boolean>;
}
