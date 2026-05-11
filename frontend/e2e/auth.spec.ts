import { expect, test, type Page, type Route } from '@playwright/test';

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function registerAuthSuccessStub(page: Page, endpoint: '/api/v1/auth/login' | '/api/v1/auth/signup') {
  await page.route(`**${endpoint}`, async (route) => {
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

async function registerAppsListStub(page: Page) {
  await page.route('**/api/v1/apps', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await fulfillJson(route, 200, { success: true, data: [] });
  });
}

async function expectAuthenticatedAppList(page: Page) {
  await expect(page.getByRole('heading', { name: 'Todo App TDD' })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Create App' })).toBeVisible();
  await expect(page.getByText('No apps yet. Create your first app!')).toBeVisible();
}

test('login happy path @merge @api', async ({ page }) => {
  await registerAuthSuccessStub(page, '/api/v1/auth/login');
  await registerAppsListStub(page);

  await page.goto('/');

  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  await expectAuthenticatedAppList(page);
});

test('signup happy path @merge @api', async ({ page }) => {
  await registerAuthSuccessStub(page, '/api/v1/auth/signup');
  await registerAppsListStub(page);

  await page.goto('/');

  await page.getByRole('button', { name: 'Sign Up' }).click();
  await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();

  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign Up' }).click();

  await expectAuthenticatedAppList(page);
});
