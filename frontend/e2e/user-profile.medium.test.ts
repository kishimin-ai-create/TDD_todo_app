import { expect, test, type Page, type Route } from '@playwright/test'

// ---------------------------------------------------------------------------
// Stub helpers
// ---------------------------------------------------------------------------

/**
 * Fills a Playwright route with a JSON response.
 */
async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

/**
 * Stubs POST /api/v1/auth/signup to return a successful auth response.
 */
async function registerSignupSuccessStub(page: Page) {
  await page.route('**/api/v1/auth/signup', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await fulfillJson(route, 200, {
      success: true,
      data: {
        token: 'test-token',
        user: { id: 'user-1', email: 'user@example.com' },
      },
    })
  })
}

/**
 * Stubs GET /api/v1/apps to return an empty apps list.
 */
async function registerAppsListStub(page: Page) {
  await page.route('**/api/v1/apps', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await fulfillJson(route, 200, { success: true, data: [] })
  })
}

/**
 * Stubs PUT /api/v1/users/:userId to return a successful update response.
 */
async function registerUpdateUserProfileSuccessStub(page: Page, updatedEmail: string) {
  await page.route('**/api/v1/users/**', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue()
      return
    }
    await fulfillJson(route, 200, {
      success: true,
      data: { id: 'user-1', email: updatedEmail },
    })
  })
}

// ---------------------------------------------------------------------------
// Shared action: sign up and reach the authenticated app-list view
// ---------------------------------------------------------------------------

/**
 * Signs up through the UI and waits until the app-list page is visible.
 */
async function signupAndReachAppList(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign Up' }).click()
  await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible()

  await page.getByLabel('Email').fill('user@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign Up' }).click()

  await expect(page.getByRole('button', { name: '+ Create App' })).toBeVisible()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('user profile edit: profile edit button is visible in the header after login @merge @api', async ({ page }) => {
  // Arrange
  await registerSignupSuccessStub(page)
  await registerAppsListStub(page)

  // Act
  await signupAndReachAppList(page)

  // Assert — a profile / edit-profile button must be visible in the header
  await expect(page.getByRole('button', { name: /profile|プロフィール|edit profile/i })).toBeVisible()
})

test('user profile edit: clicking profile button shows user profile page with email input @merge @api', async ({ page }) => {
  // Arrange
  await registerSignupSuccessStub(page)
  await registerAppsListStub(page)

  await signupAndReachAppList(page)

  // Act — navigate to profile edit via the header button
  await page.getByRole('button', { name: /profile|プロフィール|edit profile/i }).click()

  // Assert — the profile edit page shows an email input field
  await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
})

test('user profile edit: email input is pre-filled with current user email @merge @api', async ({ page }) => {
  // Arrange
  await registerSignupSuccessStub(page)
  await registerAppsListStub(page)

  await signupAndReachAppList(page)
  await page.getByRole('button', { name: /profile|プロフィール|edit profile/i }).click()

  // Assert — the email input shows the logged-in user's current email
  await expect(page.getByRole('textbox', { name: /email/i })).toHaveValue('user@example.com')
})

test('user profile edit: saving a new email shows "保存しました" success message @merge @api', async ({ page }) => {
  // Arrange
  await registerSignupSuccessStub(page)
  await registerAppsListStub(page)
  await registerUpdateUserProfileSuccessStub(page, 'newemail@example.com')

  await signupAndReachAppList(page)
  await page.getByRole('button', { name: /profile|プロフィール|edit profile/i }).click()

  // Act — clear current email, type a new one and save
  await page.getByRole('textbox', { name: /email/i }).clear()
  await page.getByRole('textbox', { name: /email/i }).fill('newemail@example.com')
  await page.getByRole('button', { name: /保存/i }).click()

  // Assert — the Japanese success message is shown
  await expect(page.getByText('保存しました')).toBeVisible()
})

test('user profile edit: "← 戻る" button navigates back to app list @merge @api', async ({ page }) => {
  // Arrange
  await registerSignupSuccessStub(page)
  await registerAppsListStub(page)

  await signupAndReachAppList(page)
  await page.getByRole('button', { name: /profile|プロフィール|edit profile/i }).click()

  // Verify we are on the profile edit page
  await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()

  // Act — click the back button
  await page.getByRole('button', { name: /← 戻る/i }).click()

  // Assert — the app-list page is shown again
  await expect(page.getByRole('button', { name: '+ Create App' })).toBeVisible()
})
