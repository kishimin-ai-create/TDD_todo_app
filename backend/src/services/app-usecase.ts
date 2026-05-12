import type { AppEntity } from '../models/app';

/**
 * Input type for creating an app.
 */
export type CreateAppInput = { name: string; userId: string };
/**
 * Input for retrieving an app.
 */
export type GetAppInput = { appId: string; userId: string };
/**
 * Input for updating an app.
 */
export type UpdateAppInput = { appId: string; userId: string; name?: string };
/**
 * Input for deleting an app.
 */
export type DeleteAppInput = { appId: string; userId: string };

/**
 * Use case interface for app operations.
 */
export interface AppUsecase {
  create(input: CreateAppInput): Promise<AppEntity>;
  list(userId: string): Promise<AppEntity[]>;
  get(input: GetAppInput): Promise<AppEntity>;
  update(input: UpdateAppInput): Promise<AppEntity>;
  delete(input: DeleteAppInput): Promise<AppEntity>;
}
