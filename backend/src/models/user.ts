/**
 * User entity representing a registered account.
 */
export type UserEntity = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};
