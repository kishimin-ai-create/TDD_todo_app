import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import App from './App'
import { isAuthenticatedAtom } from './shared/auth'
import { renderWithProviders } from './test/renderWithProviders'

describe('App', () => {
  describe('Unauthenticated', () => {
    it('when not authenticated, then shows Login page', () => {
      const store = createStore()
      store.set(isAuthenticatedAtom, false)
      renderWithProviders(<App />, { store })
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    })

    it('when not authenticated and Sign up clicked, then shows Signup page', async () => {
      const user = userEvent.setup()
      const store = createStore()
      store.set(isAuthenticatedAtom, false)
      renderWithProviders(<App />, { store })

      await user.click(screen.getByRole('button', { name: /sign up/i }))

      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })
  })

  describe('Authenticated', () => {
    it('when authenticated, then shows the app list page with Create App button', async () => {
      const store = createStore()
      store.set(isAuthenticatedAtom, true)
      renderWithProviders(<App />, { store })
      expect(
        await screen.findByRole('button', { name: /create app/i }),
      ).toBeInTheDocument()
    })
  })
})
