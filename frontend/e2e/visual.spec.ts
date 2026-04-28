import { test, expect } from '@playwright/test';

// Snapshots are stored under e2e/__snapshots__/ and committed to git.
// To update baselines: npx playwright test --update-snapshots
test.describe('@visual', () => {
  test('home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });
});
