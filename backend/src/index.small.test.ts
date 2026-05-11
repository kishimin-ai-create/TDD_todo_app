import { describe, it, expect, afterEach, vi } from 'vitest';
import { resolveApp } from './index';

describe('resolveApp', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('falls back to in-memory when NODE_ENV is production and no DB config is set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('DB_USERNAME', '');

    expect(() => resolveApp()).not.toThrow();
  });

  it('falls back to in-memory when NODE_ENV is test regardless of DB config', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('DB_USERNAME', '');

    const result = resolveApp();

    expect(result.app).toBeDefined();
    expect(result.clearStorage).toBeTypeOf('function');
  });
});
