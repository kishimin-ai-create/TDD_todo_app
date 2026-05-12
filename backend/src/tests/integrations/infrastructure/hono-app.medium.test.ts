import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createHonoApp } from '../../../infrastructure/hono-app';
import { createAppController } from '../../../controllers/app-controller';
import { createTodoController } from '../../../controllers/todo-controller';
import { createAppInteractor } from '../../../services/app-interactor';
import { createTodoInteractor } from '../../../services/todo-interactor';
import { createAuthInteractor } from '../../../services/auth-interactor';
import { createInMemoryAppRepository, createInMemoryTodoRepository, createInMemoryUserRepository } from '../../../infrastructure/in-memory-repositories';
import { createInMemoryStorage } from '../../../infrastructure/in-memory-storage';

function buildApp() {
  const storage = createInMemoryStorage();
  const appRepository = createInMemoryAppRepository(storage);
  const todoRepository = createInMemoryTodoRepository(storage);
  const userRepository = createInMemoryUserRepository();
  const appUsecase = createAppInteractor({ appRepository, todoRepository });
  const todoUsecase = createTodoInteractor({ appRepository, todoRepository });
  const authUsecase = createAuthInteractor({ userRepository });
  const appController = createAppController(appUsecase);
  const todoController = createTodoController(todoUsecase);
  return {
    app: createHonoApp({ appController, todoController, authUsecase }),
    clearStorage: () => storage.clear(),
  };
}

function req(app: ReturnType<typeof buildApp>['app'], method: string, path: string, body?: unknown) {
  return app.request(`http://localhost${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe('HonoApp integration', () => {
  describe('root route', () => {
    it('GET / returns 200 with text response', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/');
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('Hono');
    });
  });

  describe('unknown routes', () => {
    it('GET /unknown returns 404', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/unknown');
      expect(res.status).toBe(404);
    });

    it('GET /api/v1/unknown returns 404', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/api/v1/unknown');
      expect(res.status).toBe(404);
    });

    it('POST /api/v1/unknown returns 404', async () => {
      const { app } = buildApp();
      const res = await req(app, 'POST', '/api/v1/unknown', {});
      expect(res.status).toBe(404);
    });
  });

  describe('Content-Type header', () => {
    it('GET /api/v1/apps returns application/json Content-Type', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/api/v1/apps');
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });

    it('POST /api/v1/apps returns application/json Content-Type on success', async () => {
      const { app } = buildApp();
      const res = await req(app, 'POST', '/api/v1/apps', { name: 'Test' });
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });

    it('POST /api/v1/apps returns application/json Content-Type on error', async () => {
      const { app } = buildApp();
      const res = await req(app, 'POST', '/api/v1/apps', {});
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });
  });

  describe('malformed body handling', () => {
    it('POST with non-JSON body falls back to empty body (returns 422)', async () => {
      const { app } = buildApp();
      const res = await app.request('http://localhost/api/v1/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });
      expect(res.status).toBe(422);
    });

    it('PUT with no body is accepted as no-op update (200)', async () => {
      const { app } = buildApp();
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' });
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await app.request(`http://localhost/api/v1/apps/${data.id}`, {
        method: 'PUT',
      });
      expect(res.status).toBe(200);
    });
  });

  describe('all app routes are wired', () => {
    it('POST /api/v1/apps creates an app (201)', async () => {
      const { app } = buildApp();
      const res = await req(app, 'POST', '/api/v1/apps', { name: 'A' });
      expect(res.status).toBe(201);
    });

    it('GET /api/v1/apps lists apps (200)', async () => {
      const { app } = buildApp();
      const res = await req(app, 'GET', '/api/v1/apps');
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/apps/:id gets app (200)', async () => {
      const { app } = buildApp();
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'B' });
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await req(app, 'GET', `/api/v1/apps/${data.id}`);
      expect(res.status).toBe(200);
    });

    it('PUT /api/v1/apps/:id updates app (200)', async () => {
      const { app } = buildApp();
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'C' });
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await req(app, 'PUT', `/api/v1/apps/${data.id}`, { name: 'D' });
      expect(res.status).toBe(200);
    });

    it('DELETE /api/v1/apps/:id deletes app (200)', async () => {
      const { app } = buildApp();
      const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'E' });
      const { data } = await createRes.json() as { data: { id: string } };
      const res = await req(app, 'DELETE', `/api/v1/apps/${data.id}`);
      expect(res.status).toBe(200);
    });
  });

  describe('all todo routes are wired', () => {
    it('POST /api/v1/apps/:id/todos creates a todo (201)', async () => {
      const { app } = buildApp();
      const createAppRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' });
      const { data: appData } = await createAppRes.json() as { data: { id: string } };
      const res = await req(app, 'POST', `/api/v1/apps/${appData.id}/todos`, { title: 'T' });
      expect(res.status).toBe(201);
    });

    it('GET /api/v1/apps/:id/todos lists todos (200)', async () => {
      const { app } = buildApp();
      const createAppRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' });
      const { data: appData } = await createAppRes.json() as { data: { id: string } };
      const res = await req(app, 'GET', `/api/v1/apps/${appData.id}/todos`);
      expect(res.status).toBe(200);
    });
  });

  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  describe('API request/response logging middleware', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Enable API logging for tests
      process.env.LOG_API_REQUESTS = 'true';
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      // Disable API logging after tests
      delete process.env.LOG_API_REQUESTS;
    });

    describe('Happy Path - Successful API requests logging', () => {
      it('should log GET /api/v1/apps with method, path, status, and response time when successful', async () => {
        // Arrange
        const { app } = buildApp();

        // Act
        const res = await req(app, 'GET', '/api/v1/apps');
        expect(res.status).toBe(200);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('GET') && call[0].includes('/api/v1/apps')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[GET\]/);
        expect(logMessage).toContain('/api/v1/apps');
        expect(logMessage).toContain('200');
        expect(logMessage).toMatch(/\d+ms/);
      });

      it('should log POST /api/v1/apps with 201 status code when app created successfully', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/apps', { name: 'TestApp' });
        expect(res.status).toBe(201);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('POST') && call[0].includes('/api/v1/apps')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[POST\]/);
        expect(logMessage).toContain('/api/v1/apps');
        expect(logMessage).toContain('201');
        expect(logMessage).toMatch(/\d+ms/);
      });

      it('should log GET /api/v1/apps/:id with correct method and status code', async () => {
        // Arrange
        const { app } = buildApp();
        const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' });
        const { data } = await createRes.json() as { data: { id: string } };
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'GET', `/api/v1/apps/${data.id}`);
        expect(res.status).toBe(200);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('GET') && call[0].includes('/api/v1/apps/')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[GET\]/);
        expect(logMessage).toContain('200');
      });

      it('should log PUT /api/v1/apps/:id with method and status code when updated successfully', async () => {
        // Arrange
        const { app } = buildApp();
        const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'OriginalName' });
        const { data } = await createRes.json() as { data: { id: string } };
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'PUT', `/api/v1/apps/${data.id}`, { name: 'UpdatedName' });
        expect(res.status).toBe(200);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('PUT') && call[0].includes('/api/v1/apps/')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[PUT\]/);
        expect(logMessage).toContain('200');
      });

      it('should log DELETE /api/v1/apps/:id with method and status code when deleted successfully', async () => {
        // Arrange
        const { app } = buildApp();
        const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'AppToDelete' });
        const { data } = await createRes.json() as { data: { id: string } };
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'DELETE', `/api/v1/apps/${data.id}`);
        expect(res.status).toBe(200);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('DELETE') && call[0].includes('/api/v1/apps/')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[DELETE\]/);
        expect(logMessage).toContain('200');
      });

      it('should log POST /api/v1/auth/signup when user created successfully with 201 status', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/auth/signup', {
          email: 'test@example.com',
          password: 'password123',
        });
        expect(res.status).toBe(201);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('POST') && call[0].includes('/api/v1/auth/signup')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[POST\]/);
        expect(logMessage).toContain('/api/v1/auth/signup');
        expect(logMessage).toContain('201');
      });

      it('should log POST /api/v1/auth/login when user logs in successfully with 200 status', async () => {
        // Arrange
        const { app } = buildApp();
        // Create a user first
        await req(app, 'POST', '/api/v1/auth/signup', {
          email: 'login@example.com',
          password: 'password123',
        });
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/auth/login', {
          email: 'login@example.com',
          password: 'password123',
        });
        expect(res.status).toBe(200);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('POST') && call[0].includes('/api/v1/auth/login')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[POST\]/);
        expect(logMessage).toContain('/api/v1/auth/login');
        expect(logMessage).toContain('200');
      });
    });

    describe('Boundary Cases - Non-API routes NOT logged', () => {
      it('should NOT log GET / root route even when successful (200)', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'GET', '/');
        expect(res.status).toBe(200);

        // Assert
        // Check that no log starts with [GET] and contains only "/"
        const logCalls = consoleLogSpy.mock.calls.filter((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].match(/\[GET\].*\s+\/$/)
        );
        expect(logCalls.length).toBe(0);
      });

      it('should NOT log GET /doc route even when successful (200)', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'GET', '/doc');
        expect(res.status).toBe(200);

        // Assert
        // Check that no log contains /doc
        const logCalls = consoleLogSpy.mock.calls.filter((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('/doc')
        );
        expect(logCalls.length).toBe(0);
      });
    });

    describe('Log Format Specification', () => {
      it('should include [METHOD] format in log message', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps');

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[GET]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/^\[GET\]/); // Should start with [METHOD]
      });

      it('should include path after method in log message', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps');

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[GET]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toContain('/api/v1/apps');
      });

      it('should include status code (200) in log message', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps');

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[GET]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toContain('200');
      });

      it('should include status code (201) in log message for created resources', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'POST', '/api/v1/apps', { name: 'NewApp' });

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[POST]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toContain('201');
      });

      it('should include response time in milliseconds (ms) in log message', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps');

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[GET]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\d+ms/); // Should contain numeric value followed by 'ms'
      });

      it('should include arrow separator (→) between path and status in log message', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps');

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[GET]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toContain('→');
      });

      it('should have response time in parentheses in log message', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps');

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[GET]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\(\d+ms\)/); // Response time should be in parentheses
      });
    });

    describe('Multiple API request logging', () => {
      it('should log multiple sequential successful API requests independently', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res1 = await req(app, 'GET', '/api/v1/apps');
        expect(res1.status).toBe(200);
        const res2 = await req(app, 'POST', '/api/v1/apps', { name: 'App1' });
        expect(res2.status).toBe(201);

        // Assert
        expect(consoleLogSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
        const getLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[GET]') && call[0].includes('/api/v1/apps')
        );
        const postLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[POST]') && call[0].includes('/api/v1/apps')
        );
        expect(getLogCall).toBeDefined();
        expect(postLogCall).toBeDefined();
      });
    });

    describe('Response time measurement accuracy', () => {
      it('should measure response time in milliseconds with numeric value', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps');

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[GET]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        const timeMatch = logMessage.match(/\((\d+)ms\)/);
        expect(timeMatch).toBeDefined();
        expect(parseInt(timeMatch![1], 10)).toBeGreaterThanOrEqual(0);
      });

      it('should record response time as positive integer for successful requests', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'POST', '/api/v1/apps', { name: 'TestApp' });

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[POST]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        const timeMatch = logMessage.match(/\((\d+)ms\)/);
        expect(timeMatch).toBeDefined();
        const responseTime = parseInt(timeMatch![1], 10);
        expect(responseTime).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(responseTime)).toBe(true);
      });
    });

    describe('Error Logging (4xx, 5xx status) - New Specification', () => {
      it('should log 409 conflict error from POST /api/v1/auth/signup with duplicate email using ERROR format', async () => {
        // Arrange
        const { app } = buildApp();
        const email = 'conflict@example.com';
        // Create first user to trigger conflict
        await req(app, 'POST', '/api/v1/auth/signup', {
          email,
          password: 'password123',
        });
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/auth/signup', {
          email,
          password: 'password456',
        });
        expect(res.status).toBe(409);

        // Assert
        // Should log with ERROR format: [METHOD] path → ERROR status — code: message
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('POST') && 
          call[0].includes('/api/v1/auth/signup') &&
          call[0].includes('ERROR') &&
          call[0].includes('409')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        // Verify format: [METHOD] path → ERROR status — code: message
        expect(logMessage).toMatch(/\[POST\].*→ ERROR 409/);
        expect(logMessage).toContain('EMAIL_ALREADY_EXISTS');
      });

      it('should log 401 unauthorized error from POST /api/v1/auth/login with invalid credentials using ERROR format', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/auth/login', {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });
        expect(res.status).toBe(401);

        // Assert
        // Should log with ERROR format
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('POST') && 
          call[0].includes('/api/v1/auth/login') &&
          call[0].includes('ERROR') &&
          call[0].includes('401')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[POST\].*→ ERROR 401/);
        expect(logMessage).toContain('INVALID_CREDENTIALS');
      });

      it('should log 404 not found error from GET /api/v1/apps/:appId with invalid ID using ERROR format', async () => {
        // Arrange
        const { app } = buildApp();
        const invalidId = 'nonexistent-id-12345';
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'GET', `/api/v1/apps/${invalidId}`);
        expect(res.status).toBe(404);

        // Assert
        // Should log with ERROR format
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('GET') && 
          call[0].includes('/api/v1/apps/') &&
          call[0].includes('ERROR') &&
          call[0].includes('404')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[GET\].*→ ERROR 404/);
      });

      it('should log 422 validation error from POST /api/v1/apps with missing required field using ERROR format', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/apps', {}); // Missing name field
        expect(res.status).toBe(422);

        // Assert
        // Should log with ERROR format for validation errors
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('POST') && 
          call[0].includes('/api/v1/apps') &&
          call[0].includes('ERROR') &&
          call[0].includes('422')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[POST\].*→ ERROR 422/);
        expect(logMessage).toContain('VALIDATION_ERROR');
      });

      it('should include error code and message in 409 error log from POST /api/v1/auth/signup', async () => {
        // Arrange
        const { app } = buildApp();
        const email = 'error-code-test@example.com';
        await req(app, 'POST', '/api/v1/auth/signup', {
          email,
          password: 'password123',
        });
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/auth/signup', {
          email,
          password: 'password456',
        });
        expect(res.status).toBe(409);

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('[POST]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        // Should contain format: [METHOD] path → ERROR status — code: message
        expect(logMessage).toMatch(/→ ERROR 409 —/);
        expect(logMessage).toContain('EMAIL_ALREADY_EXISTS');
      });

      it('should include arrow (→) and ERROR keyword in error response logs', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'GET', '/api/v1/apps/invalid-id');
        expect(res.status).toBe(404);

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[GET]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toContain('→');
        expect(logMessage).toContain('ERROR');
      });

      it('should have double dash (—) separator between status and error code in error logs', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/apps', {});
        expect(res.status).toBe(422);

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('[POST]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        // Should contain the double dash separator
        expect(logMessage).toContain('—');
      });

      it('should log POST /api/v1/auth/login with 401 error and error code format', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/auth/login', {
          email: 'nonexistent@test.com',
          password: 'validpassword123',
        });

        // Assert
        expect(res.status).toBe(401);
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('ERROR')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[POST\].*→ ERROR 401.*INVALID_CREDENTIALS/);
      });

      it('should log 404 error for GET /api/v1/apps/:id/todos with invalid app ID', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'GET', '/api/v1/apps/nonexistent-app/todos');
        expect(res.status).toBe(404);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalled();
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('GET') && 
          call[0].includes('/api/v1/apps/')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/ERROR 404/);
      });
    });

    describe('Error Logging Format Specification Compliance', () => {
      it('should have exact format [METHOD] path → ERROR status — code: message for 409 errors', async () => {
        // Arrange
        const { app } = buildApp();
        const email = 'format-test@example.com';
        await req(app, 'POST', '/api/v1/auth/signup', {
          email,
          password: 'password123',
        });
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'POST', '/api/v1/auth/signup', {
          email,
          password: 'password456',
        });

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('[POST]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        // Verify complete format: [METHOD] path → ERROR status — code: message
        expect(logMessage).toMatch(/^\[POST\].*\/api\/v1\/auth\/signup.*→ ERROR 409 —/);
      });

      it('should have exact format [METHOD] path → ERROR status — code: message for 401 errors', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'POST', '/api/v1/auth/login', {
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        });

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('[POST]') &&
          call[0].includes('auth/login')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/^\[POST\].*\/api\/v1\/auth\/login.*→ ERROR 401 —/);
      });

      it('should have exact format [METHOD] path → ERROR status — code: message for 404 errors', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps/invalid-app-id-xyz');

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('[GET]')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/^\[GET\].*\/api\/v1\/apps\/.*→ ERROR 404 —/);
      });

      it('should have exact format [METHOD] path → ERROR status — code: message for 422 errors', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'POST', '/api/v1/apps', { name: null });

        // Assert
        const logCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('[POST]') &&
          call[0].includes('/api/v1/apps')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/^\[POST\].*\/api\/v1\/apps.*→ ERROR 422 —/);
      });
    });

    describe('Error vs Success Logging Distinction', () => {
      it('should log successful requests with → status format (no ERROR keyword)', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps');

        // Assert
        const successLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('[GET]') &&
          call[0].includes('/api/v1/apps')
        );
        expect(successLogCall).toBeDefined();
        const successLog = successLogCall![0] as string;
        // Success logs should NOT contain ERROR keyword
        expect(successLog).not.toContain('ERROR');
        // Should have simple format: → 200
        expect(successLog).toMatch(/→ 200/);
      });

      it('should log error requests with → ERROR status format (with ERROR keyword)', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        await req(app, 'GET', '/api/v1/apps/invalid');

        // Assert
        const errorLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('[GET]')
        );
        expect(errorLogCall).toBeDefined();
        const errorLog = errorLogCall![0] as string;
        // Error logs should contain ERROR keyword
        expect(errorLog).toContain('ERROR');
        // Should have error format: → ERROR 404
        expect(errorLog).toMatch(/→ ERROR 404/);
      });

      it('should differentiate between 2xx success (no ERROR) and 4xx error (with ERROR) in logs', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act - Create successful request
        const createRes = await req(app, 'POST', '/api/v1/apps', { name: 'Success' });
        expect(createRes.status).toBe(201);

        // Act - Create failed request (validation error)
        const failRes = await req(app, 'POST', '/api/v1/apps', {}); // Missing name
        expect(failRes.status).toBe(422);

        // Assert
        const successLog = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('[POST]') &&
          call[0].includes('201')
        );
        const errorLog = consoleLogSpy.mock.calls.find((call: unknown[]) =>
          typeof call[0] === 'string' && 
          call[0].includes('[POST]') &&
          call[0].includes('422')
        );

        // Success log should exist and not have ERROR
        expect(successLog).toBeDefined();
        expect(successLog![0]).not.toContain('ERROR');

        // Error log should exist and have ERROR keyword
        expect(errorLog).toBeDefined();
        expect(errorLog![0]).toContain('ERROR');
      });
    });
  });
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */

  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  describe('Error logging always-on behavior (no LOG_API_REQUESTS env var)', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Ensure LOG_API_REQUESTS is NOT set — tests here verify always-on error logging
      delete process.env.LOG_API_REQUESTS;
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      delete process.env.LOG_API_REQUESTS;
    });

    it('should log 4xx error response even when LOG_API_REQUESTS is not set', async () => {
      // Arrange
      const { app } = buildApp();

      // Act — POST with empty body triggers 422 validation error
      const res = await req(app, 'POST', '/api/v1/apps', {});
      expect(res.status).toBe(422);

      // Assert — error log must be emitted even without LOG_API_REQUESTS
      const errorLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].includes('ERROR') &&
        call[0].includes('422')
      );
      expect(errorLogCall).toBeDefined();
    });

    it('should log 401 error response even when LOG_API_REQUESTS is not set', async () => {
      // Arrange
      const { app } = buildApp();

      // Act — login with non-existent credentials triggers 401
      // Note: password must be long enough to pass validation (>=8 chars), but email doesn't exist → 401
      const res = await req(app, 'POST', '/api/v1/auth/login', {
        email: 'nobody@example.com',
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);

      // Assert — error log must be emitted and match the error format
      const errorLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].includes('[POST]') &&
        call[0].includes('ERROR') &&
        call[0].includes('401')
      );
      expect(errorLogCall).toBeDefined();
      const logMessage = errorLogCall![0] as string;
      expect(logMessage).toMatch(/\[POST\].*→ ERROR 401/);
    });

    it('should log 409 conflict error even when LOG_API_REQUESTS is not set', async () => {
      // Arrange — sign up once so the email is taken
      const { app } = buildApp();
      await req(app, 'POST', '/api/v1/auth/signup', {
        email: 'always-on@example.com',
        password: 'password123',
      });
      consoleLogSpy.mockClear();

      // Act — sign up again with the same email triggers 409
      const res = await req(app, 'POST', '/api/v1/auth/signup', {
        email: 'always-on@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(409);

      // Assert — error log must be emitted with 409 and EMAIL_ALREADY_EXISTS
      const errorLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].includes('ERROR') &&
        call[0].includes('409')
      );
      expect(errorLogCall).toBeDefined();
      const logMessage = errorLogCall![0] as string;
      expect(logMessage).toMatch(/→ ERROR 409/);
      expect(logMessage).toContain('EMAIL_ALREADY_EXISTS');
    });

    it('should NOT log successful 2xx response when LOG_API_REQUESTS is not set', async () => {
      // Arrange
      const { app } = buildApp();

      // Act — GET /api/v1/apps returns 200
      const res = await req(app, 'GET', '/api/v1/apps');
      expect(res.status).toBe(200);

      // Assert — no log call should match the success format [GET] … → 200
      const successLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].match(/\[GET\].*→ 200/) !== null
      );
      expect(successLogCall).toBeUndefined();
    });

    it('should log 4xx error but NOT log 2xx success when LOG_API_REQUESTS is not set', async () => {
      // Arrange
      const { app } = buildApp();

      // Act — success request (200)
      const successRes = await req(app, 'GET', '/api/v1/apps');
      expect(successRes.status).toBe(200);

      // Act — error request (422)
      const errorRes = await req(app, 'POST', '/api/v1/apps', {});
      expect(errorRes.status).toBe(422);

      // Assert — there IS a log call matching ERROR 422
      const errorLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].includes('ERROR') &&
        call[0].includes('422')
      );
      expect(errorLogCall).toBeDefined();

      // Assert — there is NO log call matching a 200 success entry
      const successLogCall = consoleLogSpy.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0].match(/→ 200/) !== null
      );
      expect(successLogCall).toBeUndefined();
    });
  });
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
});
