const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3306;
const DEFAULT_DATABASE = 'TDDTodoAppDB';

export type MysqlConnectionConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

function parsePort(portValue: string | undefined): number {
  if (!portValue) {
    return DEFAULT_PORT;
  }

  const port = Number(portValue);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid MySQL port: "${portValue}"`);
  }

  return port;
}

function createConfigFromDatabaseUrl(): MysqlConnectionConfig | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return undefined;
  }

  const url = new URL(databaseUrl);
  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must use the mysql:// protocol');
  }

  const database = url.pathname.replace(/^\//, '');
  if (!database) {
    throw new Error('DATABASE_URL must include a database name');
  }

  const user = decodeURIComponent(url.username);
  if (!user) {
    throw new Error('DATABASE_URL must include a username');
  }

  return {
    host: url.hostname || DEFAULT_HOST,
    port: parsePort(url.port || undefined),
    database,
    user,
    password: decodeURIComponent(url.password),
  };
}

/**
 * Resolves MySQL connection settings from DATABASE_URL or legacy DB_* variables.
 */
export function getMysqlConnectionConfig(): MysqlConnectionConfig {
  const databaseUrlConfig = createConfigFromDatabaseUrl();
  if (databaseUrlConfig) {
    return databaseUrlConfig;
  }

  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  if (!user || password === undefined) {
    throw new Error(
      'DB_USERNAME and DB_PASSWORD environment variables are required when DATABASE_URL is not set',
    );
  }

  return {
    host: process.env.DB_HOST ?? DEFAULT_HOST,
    port: parsePort(process.env.DB_PORT),
    database: process.env.DB_DATABASE ?? DEFAULT_DATABASE,
    user,
    password,
  };
}
