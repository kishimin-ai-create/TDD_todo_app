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

  describe('API request/response logging middleware', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
          typeof call[0] === 'string' && call[0].includes('POST') && call[0].includes('/api/v1/auth/login')
        );
        expect(logCall).toBeDefined();
        const logMessage = logCall![0] as string;
        expect(logMessage).toMatch(/\[POST\]/);
        expect(logMessage).toContain('/api/v1/auth/login');
        expect(logMessage).toContain('200');
      });
    });

    describe('Error Cases - Validation and error responses NOT logged', () => {
      it('should NOT log validation error responses (422) from POST /api/v1/apps with invalid body', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'POST', '/api/v1/apps', {}); // missing required 'name' field
        expect(res.status).toBe(422);

        // Assert
        // Check that no log contains POST /api/v1/apps with 422 status
        const logCalls = consoleLogSpy.mock.calls.filter(call =>
          typeof call[0] === 'string' && call[0].includes('POST') && call[0].includes('/api/v1/apps') && call[0].includes('422')
        );
        expect(logCalls.length).toBe(0);
      });

      it('should NOT log 404 error responses from GET /api/v1/unknown', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const res = await req(app, 'GET', '/api/v1/unknown');
        expect(res.status).toBe(404);

        // Assert
        // Check that no log contains 404
        const logCalls = consoleLogSpy.mock.calls.filter(call =>
          typeof call[0] === 'string' && call[0].includes('404')
        );
        expect(logCalls.length).toBe(0);
      });

      it('should NOT log 409 conflict error from POST /api/v1/auth/signup when email already exists', async () => {
        // Arrange
        const { app } = buildApp();
        const email = 'duplicate@example.com';
        // Create first user
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
        // Check that no log contains POST /api/v1/auth/signup with 409 status
        const logCalls = consoleLogSpy.mock.calls.filter(call =>
          typeof call[0] === 'string' && call[0].includes('POST') && call[0].includes('/api/v1/auth/signup') && call[0].includes('409')
        );
        expect(logCalls.length).toBe(0);
      });

      it('should NOT log 401 unauthorized error from POST /api/v1/auth/login with invalid credentials', async () => {
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
        // Check that no log contains 401
        const logCalls = consoleLogSpy.mock.calls.filter(call =>
          typeof call[0] === 'string' && call[0].includes('401')
        );
        expect(logCalls.length).toBe(0);
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
        const logCalls = consoleLogSpy.mock.calls.filter(call =>
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
        const logCalls = consoleLogSpy.mock.calls.filter(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const getLogCall = consoleLogSpy.mock.calls.find(call =>
          typeof call[0] === 'string' && call[0].includes('[GET]') && call[0].includes('/api/v1/apps')
        );
        const postLogCall = consoleLogSpy.mock.calls.find(call =>
          typeof call[0] === 'string' && call[0].includes('[POST]') && call[0].includes('/api/v1/apps')
        );
        expect(getLogCall).toBeDefined();
        expect(postLogCall).toBeDefined();
      });

      it('should log successful request but not the subsequent failed request', async () => {
        // Arrange
        const { app } = buildApp();
        consoleLogSpy.mockClear();

        // Act
        const successRes = await req(app, 'POST', '/api/v1/apps', { name: 'App' });
        expect(successRes.status).toBe(201);
        const failRes = await req(app, 'POST', '/api/v1/apps', {}); // Missing name - will fail
        expect(failRes.status).toBe(422);

        // Assert
        // Should have exactly one log for the successful POST
        const postSuccessLogs = consoleLogSpy.mock.calls.filter(call =>
          typeof call[0] === 'string' && call[0].includes('[POST]') && call[0].includes('201')
        );
        expect(postSuccessLogs.length).toBeGreaterThanOrEqual(1);

        // Should NOT have a log for the failed POST (422)
        const postFailLogs = consoleLogSpy.mock.calls.filter(call =>
          typeof call[0] === 'string' && call[0].includes('[POST]') && call[0].includes('422')
        );
        expect(postFailLogs.length).toBe(0);
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
        const logCall = consoleLogSpy.mock.calls.find(call =>
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
  });
});
