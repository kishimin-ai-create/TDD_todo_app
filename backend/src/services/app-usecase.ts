import type { AppEntity } from '../models/app';

/**
 * Input type for creating an app.
 */
export type CreateAppInput = { userId: string; name: string };
/**
 * Input for retrieving an app.
 */
export type GetAppInput = { userId: string; appId: string };
/**
 * Input for updating an app.
 */
export type UpdateAppInput = { userId: string; appId: string; name?: string };
/**
 * Input for deleting an app.
 */
export type DeleteAppInput = { userId: string; appId: string };
/**
 * Input for listing apps.
 */
export type ListAppsInput = { userId: string };

/**
 * Use case interface for app operations.
 */
export interface AppUsecase {
  create(input: CreateAppInput): Promise<AppEntity>;
  list(input: ListAppsInput): Promise<AppEntity[]>;
  get(input: GetAppInput): Promise<AppEntity>;
  update(input: UpdateAppInput): Promise<AppEntity>;
  delete(input: DeleteAppInput): Promise<AppEntity>;
}
