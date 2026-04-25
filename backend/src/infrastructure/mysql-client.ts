import mysql from 'mysql2/promise';

export type MysqlPool = mysql.Pool;

/**
 * Creates a MySQL connection pool from environment variables.
 */
export function createMysqlPool(): MysqlPool {
  return mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? '3306'),
    database: process.env.DB_DATABASE ?? 'TDDTodoAppDB',
    user: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    timezone: '+00:00',
    waitForConnections: true,
    connectionLimit: 10,
  });
}
