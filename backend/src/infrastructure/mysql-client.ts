import mysql from 'mysql2/promise';

import { getMysqlConnectionConfig } from './mysql-connection-config';

export type MysqlPool = mysql.Pool;

/**
 * Creates a MySQL connection pool from DATABASE_URL or legacy DB_* variables.
 */
export function createMysqlPool(): MysqlPool {
  const config = getMysqlConnectionConfig();

  return mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    timezone: '+00:00',
    waitForConnections: true,
    connectionLimit: 10,
  });
}
