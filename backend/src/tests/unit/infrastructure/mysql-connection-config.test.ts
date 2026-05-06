import { afterEach, describe, expect, it, vi } from 'vitest';

import { getMysqlConnectionConfig } from '../../../infrastructure/mysql-connection-config';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getMysqlConnectionConfig', () => {
  it('uses legacy DB_* environment variables when DATABASE_URL is not set', () => {
    vi.stubEnv('DATABASE_URL', undefined);
    vi.stubEnv('DB_HOST', 'db.internal');
    vi.stubEnv('DB_PORT', '3310');
    vi.stubEnv('DB_DATABASE', 'TodoApp');
    vi.stubEnv('DB_USERNAME', 'legacy-user');
    vi.stubEnv('DB_PASSWORD', 'legacy-pass');

    expect(getMysqlConnectionConfig()).toEqual({
      host: 'db.internal',
      port: 3310,
      database: 'TodoApp',
      user: 'legacy-user',
      password: 'legacy-pass',
    });
  });

  it('prefers DATABASE_URL when it is available', () => {
    vi.stubEnv('DATABASE_URL', 'mysql://render-user:render-pass@render-host:3307/render_db');
    vi.stubEnv('DB_HOST', 'ignored-host');
    vi.stubEnv('DB_PORT', '3310');
    vi.stubEnv('DB_DATABASE', 'ignored_db');
    vi.stubEnv('DB_USERNAME', 'ignored-user');
    vi.stubEnv('DB_PASSWORD', 'ignored-pass');

    expect(getMysqlConnectionConfig()).toEqual({
      host: 'render-host',
      port: 3307,
      database: 'render_db',
      user: 'render-user',
      password: 'render-pass',
    });
  });

  it('throws when neither DATABASE_URL nor legacy credentials are provided', () => {
    vi.stubEnv('DATABASE_URL', undefined);
    vi.stubEnv('DB_USERNAME', undefined);
    vi.stubEnv('DB_PASSWORD', undefined);

    expect(() => getMysqlConnectionConfig()).toThrow(
      'DB_USERNAME and DB_PASSWORD environment variables are required when DATABASE_URL is not set',
    );
  });
});
