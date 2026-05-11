const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parses and validates the request body for PUT /api/v1/users/:userId.
 */
export function parseUpdateUserProfileInput(body: unknown):
  | { success: true; email: string; currentPassword?: string; newPassword?: string }
  | { success: false; message: string } {
  if (typeof body !== 'object' || body === null) {
    return { success: false, message: 'Invalid request body.' };
  }

  const { email, currentPassword, newPassword } = body as {
    email?: unknown;
    currentPassword?: unknown;
    newPassword?: unknown;
  };

  if (typeof email !== 'string') {
    return { success: false, message: 'Email is required.' };
  }

  const normalizedEmail = email.trim();
  if (!EMAIL_RE.test(normalizedEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const hasCurrentPassword = currentPassword !== undefined;
  const hasNewPassword = newPassword !== undefined;

  if (hasNewPassword && !hasCurrentPassword) {
    return { success: false, message: 'currentPassword is required when newPassword is provided.' };
  }

  if (hasCurrentPassword && !hasNewPassword) {
    return { success: false, message: 'newPassword is required when currentPassword is provided.' };
  }

  if (hasCurrentPassword && hasNewPassword) {
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return { success: false, message: 'Passwords must be strings.' };
    }
    if (currentPassword === '' || newPassword === '') {
      return { success: false, message: 'Passwords cannot be empty.' };
    }
    return { success: true, email: normalizedEmail, currentPassword, newPassword };
  }

  return { success: true, email: normalizedEmail };
}
