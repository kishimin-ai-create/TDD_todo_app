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

  it('422: returns VALIDATION_ERROR with message when password is too short', async () => {
    const res = await request('POST', '/api/v1/auth/signup', {
      email: 'test@example.com',
      password: 'short',
    });

    expect(res.status).toBe(422);

    const json = await res.json() as {
      success: boolean;
      error: { code: string; message: string };
    };

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(typeof json.error.message).toBe('string');
    expect(json.error.message.length).toBeGreaterThan(0);
  });

  it('422: returns VALIDATION_ERROR with message when email is invalid', async () => {
    const res = await request('POST', '/api/v1/auth/signup', {
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(422);

    const json = await res.json() as {
      success: boolean;
      error: { code: string; message: string };
    };

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(typeof json.error.message).toBe('string');
    expect(json.error.message.length).toBeGreaterThan(0);
  });

  it('422: returns VALIDATION_ERROR with message when body is missing', async () => {
    const res = await request('POST', '/api/v1/auth/signup');

    expect(res.status).toBe(422);

    const json = await res.json() as {
      success: boolean;
      error: { code: string; message: string };
    };

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(typeof json.error.message).toBe('string');
    expect(json.error.message.length).toBeGreaterThan(0);
  });

  it('409: returns EMAIL_ALREADY_EXISTS when the same email is registered twice', async () => {
    // Arrange — first signup succeeds (store is clean from beforeEach)
    await request('POST', '/api/v1/auth/signup', {
      email: 'duplicate@example.com',
      password: 'password123',
    });

    // Act — second signup with the identical email
    const res = await request('POST', '/api/v1/auth/signup', {
      email: 'duplicate@example.com',
      password: 'password123',
    });

    // Assert
    expect(res.status).toBe(409);

    const json = await res.json() as {
      success: boolean;
      data: null;
      error: { code: string; message: string };
    };

    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(json.error.message).toBe('This email address is already registered.');
  });

  it('201: allows the same email to be registered again after storage is cleared', async () => {
    // Arrange — register once (beforeEach has already cleared storage)
    await request('POST', '/api/v1/auth/signup', {
      email: 'reuse@example.com',
      password: 'password123',
    });

    // Explicitly clear the store to simulate re-registration after an account is deleted.
    clearStorage();

    // Act — signup with the same email should now succeed
    const res = await request('POST', '/api/v1/auth/signup', {
      email: 'reuse@example.com',
      password: 'password123',
    });

    // Assert
    expect(res.status).toBe(201);

    const json = await res.json() as {
      success: boolean;
      data: { token: string; user: { id: string; email: string } };
    };

    expect(json.success).toBe(true);
    expect(typeof json.data.token).toBe('string');
    expect(json.data.token.length).toBeGreaterThan(0);
    expect(UUID_RE.test(json.data.user.id)).toBe(true);
    expect(json.data.user.email).toBe('reuse@example.com');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('200: returns token and user when credentials match a registered account', async () => {
    // Arrange — sign up first so the user exists in the store
    await request('POST', '/api/v1/auth/signup', {
      email: 'test@example.com',
      password: 'password123',
    });

    const res = await request('POST', '/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);

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

  it('401: returns INVALID_CREDENTIALS when the email is not registered', async () => {
    const res = await request('POST', '/api/v1/auth/login', {
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);

    const json = await res.json() as {
      success: boolean;
      data: null;
      error: { code: string; message: string };
    };

    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('INVALID_CREDENTIALS');
    expect(typeof json.error.message).toBe('string');
    expect(json.error.message.length).toBeGreaterThan(0);
  });

  it('422: returns VALIDATION_ERROR when email is invalid', async () => {
    const res = await request('POST', '/api/v1/auth/login', {
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(422);

    const json = await res.json() as {
      success: boolean;
      error: { code: string; message: string };
    };

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(typeof json.error.message).toBe('string');
    expect(json.error.message.length).toBeGreaterThan(0);
  });

  it('422: returns VALIDATION_ERROR when password is less than 8 characters', async () => {
    const res = await request('POST', '/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'short',
    });

    expect(res.status).toBe(422);

    const json = await res.json() as {
      success: boolean;
      error: { code: string; message: string };
    };

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(typeof json.error.message).toBe('string');
    expect(json.error.message.length).toBeGreaterThan(0);
  });

  it('401: returns INVALID_CREDENTIALS when password is wrong', async () => {
    await request('POST', '/api/v1/auth/signup', {
      email: 'user@example.com',
      password: 'correctPass1',
    });
    const res = await request('POST', '/api/v1/auth/login', {
      email: 'user@example.com',
      password: 'wrongPassword',
    });
    expect(res.status).toBe(401);
    const json = await res.json() as {
      success: boolean;
      data: null;
      error: { code: string; message: string };
    };
    expect(json.success).toBe(false);
    expect(json.data).toBeNull();
    expect(json.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('200: returns token when both email and password are correct', async () => {
    await request('POST', '/api/v1/auth/signup', {
      email: 'user2@example.com',
      password: 'myPassword1',
    });
    const res = await request('POST', '/api/v1/auth/login', {
      email: 'user2@example.com',
      password: 'myPassword1',
    });
    expect(res.status).toBe(200);
    const json = await res.json() as {
      success: boolean;
      data: { token: string; user: { id: string; email: string } };
    };
    expect(json.success).toBe(true);
    expect(json.data.token).toBeDefined();
  });
});
