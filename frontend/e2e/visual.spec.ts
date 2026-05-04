import { test, expect } from '@playwright/test';

test.describe('@visual', () => {
  test('home page', async ({ page }) => {
    await page.route('**/api/v1/apps', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Todo App TDD' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Create App' })).toBeVisible();
    await expect(page.getByText('No apps yet. Create your first app!')).toBeVisible();

    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot.byteLength).toBeGreaterThan(0);
  });
});
