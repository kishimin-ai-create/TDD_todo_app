import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '../../../App'
import { authAtom } from '../../../shared/auth'
import { currentPageAtom } from '../../../shared/navigation'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const AUTHENTICATED_USER = {
  token: 'test-token',
  user: { id: 'user-1', email: 'test@example.com' },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LogoutButton (integration)', () => {
  beforeEach(() => {
    // atomWithStorage syncs to localStorage; clear between tests to prevent leakage.
    localStorage.clear()

    // Stub the apps list endpoint so AppListPage renders without network errors.
    server.use(
      http.get('/api/v1/apps', () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    )
  })

  describe('Rendering - LogoutButton Visible When Authenticated', () => {
    it('when the user is authenticated, then a "ログアウト" button is visible in the layout', async () => {
      // Arrange
      const store = createStore()
      store.set(authAtom, AUTHENTICATED_USER)

      // Act
      renderWithProviders(<App />, { store, initialPage: { name: 'app-list' } })

      // Assert
      expect(
        await screen.findByRole('button', { name: 'ログアウト' }),
      ).toBeInTheDocument()
    })
  })

  describe('State Change - authAtom After Logout', () => {
    it('when the logout button is clicked, then authAtom is set to null', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      store.set(authAtom, AUTHENTICATED_USER)
      renderWithProviders(<App />, { store, initialPage: { name: 'app-list' } })

      // Act
      await user.click(await screen.findByRole('button', { name: 'ログアウト' }))

      // Assert
      await waitFor(() => {
        expect(store.get(authAtom)).toBeNull()
      })
    })
  })

  describe('Navigation - currentPageAtom After Logout', () => {
    it('when the logout button is clicked, then currentPageAtom becomes { name: "login" }', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      store.set(authAtom, AUTHENTICATED_USER)
      renderWithProviders(<App />, { store, initialPage: { name: 'app-list' } })

      // Act
      await user.click(await screen.findByRole('button', { name: 'ログアウト' }))

      // Assert
      await waitFor(() => {
        expect(store.get(currentPageAtom)).toEqual({ name: 'login' })
      })
    })
  })

  describe('UI Transition - LoginPage Rendered After Logout', () => {
    it('when the logout button is clicked, then App renders the LoginPage with an email input', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      store.set(authAtom, AUTHENTICATED_USER)
      renderWithProviders(<App />, { store, initialPage: { name: 'app-list' } })

      // Act
      await user.click(await screen.findByRole('button', { name: 'ログアウト' }))

      // Assert – LoginPage is identified by its email text input
      await waitFor(() => {
        expect(
          screen.getByRole('textbox', { name: /email/i }),
        ).toBeInTheDocument()
      })
    })

    it('when the logout button is clicked, then the "ログアウト" button is no longer in the document', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      store.set(authAtom, AUTHENTICATED_USER)
      renderWithProviders(<App />, { store, initialPage: { name: 'app-list' } })

      // Act
      await user.click(await screen.findByRole('button', { name: 'ログアウト' }))

      // Assert
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: 'ログアウト' }),
        ).not.toBeInTheDocument()
      })
    })
  })
})
