/**
 * Application entity representing a todo app.
 */
export type AppEntity = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
