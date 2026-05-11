import { beforeEach, describe, expect, it } from 'vitest';

import { clearStorage, request, UUID_RE } from '../helpers';

beforeEach(() => clearStorage());

describe('POST /api/v1/auth/signup', () => {
  it('201: creates a user with valid email and password', async () => {
    const res = await request('POST', '/api/v1/auth/signup', {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);

    const json = await res.json() as {
      success: boolean;
      data: { token: string; user: { id: string; email: string } };
    };

    expect(json.success).toBe(true);
    expect(typeof json.data.token).toBe('string');
    expect(json.data.token.length).toBeGreaterThan(0);
    expect(UUID_RE.test(json.data.user.id)).toBe(true);
    expect(json.data.user.email).toBe('test@example.com');
  });
});
