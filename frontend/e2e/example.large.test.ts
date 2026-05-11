import { test, expect } from '@playwright/test';

test('app loads @smoke', async ({ page }) => {
  await page.route('**/api/v1/apps', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  const response = await page.goto('/');
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
});
