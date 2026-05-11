/**
 * User entity representing a registered user account.
 */
export type UserEntity = {
  id: string;
  email: string;
  token: string;
  passwordHash: string;
};
