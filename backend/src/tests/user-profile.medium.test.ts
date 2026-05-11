import { beforeEach, describe, expect, it } from 'vitest';

import { clearStorage, request, UUID_RE } from './integrations/helpers';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => clearStorage());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PUT /api/v1/users/:userId', () => {
  describe('Happy Path - Valid Email Only', () => {
    it('when called with a valid email, then returns 200 status', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'new@example.com',
      });

      // Assert
      expect(res.status).toBe(200);
    });

    it('when called with a valid email, then response body has success true', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'new@example.com',
      });

      // Assert
      const json = await res.json() as { success: boolean; data: { id: string; email: string } };
      expect(json.success).toBe(true);
    });

    it('when called with a valid email, then response data contains the updated email', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'updated@example.com',
      });

      // Assert
      const json = await res.json() as { success: boolean; data: { id: string; email: string } };
      expect(json.data.email).toBe('updated@example.com');
    });

    it('when called with a valid email, then response data id matches the :userId param', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'new@example.com',
      });

      // Assert
      const json = await res.json() as { success: boolean; data: { id: string; email: string } };
      expect(json.data.id).toBe(userId);
    });

    it('when called with a valid email, then response Content-Type is application/json', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'new@example.com',
      });

      // Assert
      expect(res.headers.get('content-type')).toMatch(/application\/json/);
    });
  });

  describe('Happy Path - Valid Email With Both Passwords', () => {
    it('when called with valid email, currentPassword and newPassword, then returns 200', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'valid@example.com',
        currentPassword: 'old-password',
        newPassword: 'new-password',
      });

      // Assert
      expect(res.status).toBe(200);
    });

    it('when called with both passwords, then response body has success true', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'valid@example.com',
        currentPassword: 'old-password',
        newPassword: 'new-password',
      });

      // Assert
      const json = await res.json() as { success: boolean };
      expect(json.success).toBe(true);
    });
  });

  describe('Validation Errors - Invalid Email Format', () => {
    it('when email is not a valid format, then returns 422', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'not-a-valid-email',
      });

      // Assert
      expect(res.status).toBe(422);
    });

    it('when email is invalid, then response body has success false', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'not-a-valid-email',
      });

      // Assert
      const json = await res.json() as { success: boolean; error: { code: string; message: string } };
      expect(json.success).toBe(false);
    });

    it('when email is invalid, then error code is VALIDATION_ERROR', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'not-a-valid-email',
      });

      // Assert
      const json = await res.json() as { success: boolean; error: { code: string; message: string } };
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('when email is an empty string, then returns 422', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: '',
      });

      // Assert
      expect(res.status).toBe(422);
    });

    it('when body is empty object (email missing), then returns 422', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {});

      // Assert
      expect(res.status).toBe(422);
    });
  });

  describe('Validation Errors - Password Pair Constraints', () => {
    it('when newPassword is sent without currentPassword, then returns 422', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'valid@example.com',
        newPassword: 'new-password',
      });

      // Assert
      expect(res.status).toBe(422);
    });

    it('when newPassword is sent without currentPassword, then error code is VALIDATION_ERROR', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'valid@example.com',
        newPassword: 'new-password',
      });

      // Assert
      const json = await res.json() as { success: boolean; error: { code: string; message: string } };
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('when currentPassword is sent without newPassword, then returns 422', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'valid@example.com',
        currentPassword: 'old-password',
      });

      // Assert
      expect(res.status).toBe(422);
    });

    it('when currentPassword is sent without newPassword, then error code is VALIDATION_ERROR', async () => {
      // Arrange
      const userId = 'user-1';

      // Act
      const res = await request('PUT', `/api/v1/users/${userId}`, {
        email: 'valid@example.com',
        currentPassword: 'old-password',
      });

      // Assert
      const json = await res.json() as { success: boolean; error: { code: string; message: string } };
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

// Keep UUID_RE available for future use (avoids unused-import lint error while the
// route is not yet implemented and the id field is not yet returned)
void UUID_RE;
