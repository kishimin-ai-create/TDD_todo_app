import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { authAtom } from '../../../shared/auth'
import { currentPageAtom } from '../../../shared/navigation'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'
import { UserProfilePage } from './UserProfilePage'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-1', email: 'current@example.com' }
const MOCK_AUTH = { token: 'test-token', user: MOCK_USER }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserProfilePage', () => {
  beforeEach(() => {
    // atomWithStorage syncs to localStorage; clear between tests to avoid cross-contamination
    localStorage.clear()
  })

  describe('Content - Initial Form State', () => {
    it('when rendered with a logged-in user, then the email input is pre-filled with the current user email', () => {
      // Arrange
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)

      // Act
      renderWithProviders(<UserProfilePage />, { store })

      // Assert
      expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('current@example.com')
    })

    it('when rendered, then a new password input field is displayed', () => {
      // Arrange
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)

      // Act
      renderWithProviders(<UserProfilePage />, { store })

      // Assert
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    })

    it('when rendered, then a Save button is displayed', () => {
      // Arrange
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)

      // Act
      renderWithProviders(<UserProfilePage />, { store })

      // Assert
      expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument()
    })

    it('when rendered, then a "← 戻る" back navigation button is displayed', () => {
      // Arrange
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)

      // Act
      renderWithProviders(<UserProfilePage />, { store })

      // Assert
      expect(screen.getByRole('button', { name: /← 戻る/i })).toBeInTheDocument()
    })

    it('when rendered, then new password input value is empty initially', () => {
      // Arrange
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)

      // Act
      renderWithProviders(<UserProfilePage />, { store })

      // Assert
      const passwordInput = screen.getByLabelText(/new password/i)
      expect((passwordInput as HTMLInputElement).value).toBe('')
    })
  })

  describe('Happy Path - Successful Profile Update (email only)', () => {
    it('when a new email is submitted and the API responds with 200, then "保存しました" success message is displayed', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/users/:userId', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'user-1', email: 'new@example.com' },
          }),
        ),
      )
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      await user.clear(emailInput)
      await user.type(emailInput, 'new@example.com')
      await user.click(screen.getByRole('button', { name: /保存/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('保存しました')).toBeInTheDocument()
      })
    })

    it('when the profile update succeeds, then authAtom.user.email is updated to the new email', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/users/:userId', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'user-1', email: 'new@example.com' },
          }),
        ),
      )
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      await user.clear(emailInput)
      await user.type(emailInput, 'new@example.com')
      await user.click(screen.getByRole('button', { name: /保存/i }))

      // Assert
      await waitFor(() => {
        expect(store.get(authAtom)?.user.email).toBe('new@example.com')
      })
    })

    it('when the profile update succeeds, then authAtom.token is preserved unchanged', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/users/:userId', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'user-1', email: 'new@example.com' },
          }),
        ),
      )
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      await user.clear(emailInput)
      await user.type(emailInput, 'new@example.com')
      await user.click(screen.getByRole('button', { name: /保存/i }))

      // Assert
      await waitFor(() => {
        expect(store.get(authAtom)?.token).toBe('test-token')
      })
    })

    it('when the profile update succeeds, then authAtom.user.id is preserved unchanged', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/users/:userId', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'user-1', email: 'new@example.com' },
          }),
        ),
      )
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      await user.clear(emailInput)
      await user.type(emailInput, 'new@example.com')
      await user.click(screen.getByRole('button', { name: /保存/i }))

      // Assert
      await waitFor(() => {
        expect(store.get(authAtom)?.user.id).toBe('user-1')
      })
    })
  })

  describe('Error Handling - API Validation Failure (422)', () => {
    it('when the API responds with 422, then an error alert is displayed', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/users/:userId', () =>
          HttpResponse.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'メールアドレスの形式が正しくありません。' },
            },
            { status: 422 },
          ),
        ),
      )
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')
      await user.click(screen.getByRole('button', { name: /保存/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when the API responds with 422, then authAtom.user.email is NOT changed', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/users/:userId', () =>
          HttpResponse.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'メールアドレスの形式が正しくありません。' },
            },
            { status: 422 },
          ),
        ),
      )
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')
      await user.click(screen.getByRole('button', { name: /保存/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      expect(store.get(authAtom)?.user.email).toBe('current@example.com')
    })

    it('when the API responds with 422, then "保存しました" message is NOT displayed', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/users/:userId', () =>
          HttpResponse.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'メールアドレスの形式が正しくありません。' },
            },
            { status: 422 },
          ),
        ),
      )
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')
      await user.click(screen.getByRole('button', { name: /保存/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      expect(screen.queryByText('保存しました')).not.toBeInTheDocument()
    })

    it('when the network request fails, then an error alert is displayed', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/users/:userId', () => HttpResponse.error()),
      )
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      await user.click(screen.getByRole('button', { name: /保存/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Navigation - Back Button', () => {
    it('when "← 戻る" is clicked, then currentPageAtom becomes { name: "app-list" }', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      await user.click(screen.getByRole('button', { name: /← 戻る/i }))

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'app-list' })
    })

    it('when "← 戻る" is clicked, then the current user-profile page is no longer shown', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      store.set(currentPageAtom, { name: 'user-profile' } as Parameters<typeof store.set>[1])
      store.set(authAtom, MOCK_AUTH)
      renderWithProviders(<UserProfilePage />, { store })

      // Act
      await user.click(screen.getByRole('button', { name: /← 戻る/i }))

      // Assert
      expect(store.get(currentPageAtom)).not.toEqual({ name: 'user-profile' })
    })
  })
})
