import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { isLoggedInAtom } from '../../../shared/auth'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  describe('Rendering', () => {
    it('when rendered, then shows the login form', () => {
      renderWithProviders(<LoginPage />)

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('when submitted with empty username, then shows error message', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      await user.click(screen.getByRole('button', { name: /login/i }))

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('when submitted with empty password, then shows error message', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      await user.type(screen.getByLabelText(/username/i), 'admin')
      await user.click(screen.getByRole('button', { name: /login/i }))

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Login Success', () => {
    it('when valid username and password entered, then sets isLoggedIn to true', async () => {
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      await user.type(screen.getByLabelText(/username/i), 'admin')
      await user.type(screen.getByLabelText(/password/i), 'password')
      await user.click(screen.getByRole('button', { name: /login/i }))

      expect(store.get(isLoggedInAtom)).toBe(true)
    })
  })
})
