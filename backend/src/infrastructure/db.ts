import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';

import { getMysqlConnectionConfig } from './mysql-connection-config';

export interface AppTable {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TodoTable {
  id: string;
  appId: string;
  title: string;
  completed: number; // MySQL BOOLEAN → 0/1
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Database {
  App: AppTable;
  Todo: TodoTable;
}

/**
 * Creates a Kysely instance backed by a mysql2 connection pool.
 */
export function createKysely(): Kysely<Database> {
  const config = getMysqlConnectionConfig();
  return new Kysely<Database>({
    dialect: new MysqlDialect({
      pool: createPool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        timezone: '+00:00',
        waitForConnections: true,
        connectionLimit: 10,
      }),
    }),
  });
}
