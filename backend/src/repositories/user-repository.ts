import type { UserEntity } from '../models/user';

/**
 * Interface for user persistence operations.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<void>;
}
