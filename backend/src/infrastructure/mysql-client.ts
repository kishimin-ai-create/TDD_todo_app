import mysql from 'mysql2/promise';

export type MysqlPool = mysql.Pool;

/**
 * Creates a MySQL connection pool from environment variables.
 * Throws a startup error if required credentials are absent.
 */
export function createMysqlPool(): MysqlPool {
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  if (!user || password === undefined) {
    throw new Error(
      'DB_USERNAME and DB_PASSWORD environment variables are required',
    );
  }
  return mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? '3306'),
    database: process.env.DB_DATABASE ?? 'TDDTodoAppDB',
    user,
    password,
    timezone: '+00:00',
    waitForConnections: true,
    connectionLimit: 10,
  });
}
