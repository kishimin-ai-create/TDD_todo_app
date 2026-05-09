import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { isAuthenticatedAtom } from '../../../shared/auth'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  describe('Happy Path - Rendering', () => {
    it('when rendered, then shows login heading', () => {
      // Arrange + Act
      renderWithProviders(<LoginPage />)

      // Assert
      expect(screen.getByRole('heading', { name: /ログイン/i })).toBeInTheDocument()
    })

    it('when rendered, then shows email input', () => {
      // Arrange + Act
      renderWithProviders(<LoginPage />)

      // Assert
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
    })

    it('when rendered, then shows password input', () => {
      // Arrange + Act
      renderWithProviders(<LoginPage />)

      // Assert
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument()
    })

    it('when rendered, then shows login submit button', () => {
      // Arrange + Act
      renderWithProviders(<LoginPage />)

      // Assert
      expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument()
    })
  })

  describe('Happy Path - Successful Login', () => {
    it('when valid credentials submitted, then sets isAuthenticated to true', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      // Act
      await user.type(screen.getByLabelText(/メールアドレス/i), 'user@example.com')
      await user.type(screen.getByLabelText(/パスワード/i), 'password123')
      await user.click(screen.getByRole('button', { name: /ログイン/i }))

      // Assert
      await waitFor(() => {
        expect(store.get(isAuthenticatedAtom)).toBe(true)
      })
    })
  })

  describe('Error Cases - Validation', () => {
    it('when form submitted with empty email, then shows email required error', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      // Act
      await user.type(screen.getByLabelText(/パスワード/i), 'password123')
      await user.click(screen.getByRole('button', { name: /ログイン/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when form submitted with empty password, then shows password required error', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      // Act
      await user.type(screen.getByLabelText(/メールアドレス/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /ログイン/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when invalid email format submitted, then shows format error', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      // Act
      await user.type(screen.getByLabelText(/メールアドレス/i), 'notanemail')
      await user.type(screen.getByLabelText(/パスワード/i), 'password123')
      await user.click(screen.getByRole('button', { name: /ログイン/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when form submitted with all empty fields, then isAuthenticated remains false', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      // Act
      await user.click(screen.getByRole('button', { name: /ログイン/i }))

      // Assert — should show errors without changing auth state
      await screen.findAllByRole('alert')
      expect(store.get(isAuthenticatedAtom)).toBe(false)
    })
  })
})
