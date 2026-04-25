import type { AppEntity } from '../../domain/entities/app';

export type CreateAppInput = {
  name: string;
};

export type GetAppInput = {
  appId: string;
};

export type UpdateAppInput = {
  appId: string;
  name?: string;
};

export type DeleteAppInput = {
  appId: string;
};

export interface AppUsecase {
  create(input: CreateAppInput): Promise<AppEntity>;
  list(): Promise<AppEntity[]>;
  get(input: GetAppInput): Promise<AppEntity>;
  update(input: UpdateAppInput): Promise<AppEntity>;
  delete(input: DeleteAppInput): Promise<AppEntity>;
}
