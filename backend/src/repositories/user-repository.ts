import type { UserEntity } from '../models/user';

/**
 * Interface for user persistence operations.
 */
export interface UserRepository {
  save(user: UserEntity): Promise<void>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
}
