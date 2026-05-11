import { assert, describe, expect, it } from 'vitest';

import { parseUpdateUserProfileInput } from './user-profile-validation';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseUpdateUserProfileInput', () => {
  describe('Happy Path - Valid Email Only', () => {
    it('when body contains a valid email, then returns success true', () => {
      // Arrange
      const body = { email: 'valid@example.com' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(true);
    });

    it('when body contains a valid email, then returned email matches the input', () => {
      // Arrange
      const body = { email: 'valid@example.com' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      assert(result.success);
      expect(result.email).toBe('valid@example.com');
    });

    it('when body contains an email with leading/trailing spaces, then email is trimmed', () => {
      // Arrange
      const body = { email: '  trimmed@example.com  ' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      assert(result.success);
      expect(result.email).toBe('trimmed@example.com');
    });
  });

  describe('Happy Path - Valid Email With Both Passwords', () => {
    it('when body contains valid email, currentPassword and newPassword, then returns success true', () => {
      // Arrange
      const body = { email: 'valid@example.com', currentPassword: 'old-pass', newPassword: 'new-pass' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(true);
    });

    it('when body contains valid email and both passwords, then currentPassword is returned', () => {
      // Arrange
      const body = { email: 'valid@example.com', currentPassword: 'old-pass', newPassword: 'new-pass' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      assert(result.success);
      expect(result.currentPassword).toBe('old-pass');
    });

    it('when body contains valid email and both passwords, then newPassword is returned', () => {
      // Arrange
      const body = { email: 'valid@example.com', currentPassword: 'old-pass', newPassword: 'new-pass' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      assert(result.success);
      expect(result.newPassword).toBe('new-pass');
    });
  });

  describe('Validation Errors - Invalid Email Format', () => {
    it('when email is missing the @ symbol, then returns success false', () => {
      // Arrange
      const body = { email: 'not-an-email' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when email is an empty string, then returns success false', () => {
      // Arrange
      const body = { email: '' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when email is a whitespace-only string, then returns success false', () => {
      // Arrange
      const body = { email: '   ' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when email is not a string (number), then returns success false', () => {
      // Arrange
      const body = { email: 12345 };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when email is missing from the body, then returns success false', () => {
      // Arrange
      const body = {};

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when body is null, then returns success false', () => {
      // Arrange
      const body = null;

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when body is not an object (string), then returns success false', () => {
      // Arrange
      const body = 'email@example.com';

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Validation Errors - Password Pair Constraints', () => {
    it('when newPassword is provided without currentPassword, then returns success false', () => {
      // Arrange
      const body = { email: 'valid@example.com', newPassword: 'new-pass' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when newPassword is provided without currentPassword, then error message references currentPassword', () => {
      // Arrange
      const body = { email: 'valid@example.com', newPassword: 'new-pass' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      assert(!result.success);
      expect(result.message.toLowerCase()).toContain('currentpassword');
    });

    it('when currentPassword is provided without newPassword, then returns success false', () => {
      // Arrange
      const body = { email: 'valid@example.com', currentPassword: 'old-pass' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when currentPassword is provided without newPassword, then error message references newPassword', () => {
      // Arrange
      const body = { email: 'valid@example.com', currentPassword: 'old-pass' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      assert(!result.success);
      expect(result.message.toLowerCase()).toContain('newpassword');
    });

    it('when both currentPassword and newPassword are empty strings, then returns success false', () => {
      // Arrange — empty strings are not valid password values
      const body = { email: 'valid@example.com', currentPassword: '', newPassword: '' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('Boundary Cases - Email Format Edge Values', () => {
    it('when email is missing the domain part after @, then returns success false', () => {
      // Arrange
      const body = { email: 'user@' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when email has no local part before @, then returns success false', () => {
      // Arrange
      const body = { email: '@example.com' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(false);
    });

    it('when email is a minimal valid address (a@b.c), then returns success true', () => {
      // Arrange
      const body = { email: 'a@b.c' };

      // Act
      const result = parseUpdateUserProfileInput(body);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
