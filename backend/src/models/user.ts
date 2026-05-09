/**
 * User entity representing a registered user.
 */
export type UserEntity = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};
