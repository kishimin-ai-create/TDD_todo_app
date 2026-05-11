import { expect, test, type Page, type Route } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/** Stub POST /api/v1/auth/login to return a successful auth response. */
async function registerLoginStub(page: Page) {
  await page.route('**/api/v1/auth/login', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await fulfillJson(route, 200, {
      success: true,
      data: {
        token: 'test-token',
        user: { id: 'user-1', email: 'user@example.com' },
      },
    });
  });
}

/** Stub GET /api/v1/apps to return an empty list. */
async function registerAppsListStub(page: Page) {
  await page.route('**/api/v1/apps', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await fulfillJson(route, 200, { success: true, data: [] });
  });
}

/**
 * Seed auth state in localStorage so the app starts in the authenticated view,
 * bypassing the login form entirely.
 * authAtom uses jotai atomWithStorage with key 'auth'.
 */
async function seedAuthState(page: Page) {
  await page.addInitScript(() => {
    const authState = {
      token: 'test-token',
      user: { id: 'user-1', email: 'user@example.com' },
    };
    localStorage.setItem('auth', JSON.stringify(authState));
  });
}

/** Assert the user is on the authenticated app-list screen. */
async function expectAuthenticatedView(page: Page) {
  await expect(page.getByRole('heading', { name: 'Todo App TDD' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test(
  'logout happy path: when the logout button is clicked, then the user is redirected to the login page and the logout button disappears',
  async ({ page }) => {
    // Arrange — start as an authenticated user
    await seedAuthState(page);
    await registerAppsListStub(page);
    await page.goto('/');
    await expectAuthenticatedView(page);

    // Act — click the logout button
    await page.getByRole('button', { name: 'ログアウト' }).click();

    // Assert — login page is shown, logout button is gone
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeHidden();
  },
);

test(
  'logout then re-login: after logging out, the user can log in again and return to the authenticated view',
  async ({ page }) => {
    // Arrange — start as an authenticated user, then log out
    await seedAuthState(page);
    await registerAppsListStub(page);
    await registerLoginStub(page);
    await page.goto('/');
    await expectAuthenticatedView(page);

    await page.getByRole('button', { name: 'ログアウト' }).click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    // Act — log in again
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Assert — back to the authenticated app-list view
    await expectAuthenticatedView(page);
    await expect(page.getByText('No apps yet. Create your first app!')).toBeVisible();
  },
);
