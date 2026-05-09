import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { describe, expect, it, vi } from 'vitest'

import { isAuthenticatedAtom } from '../../../shared/auth'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  describe('Happy Path - Rendering', () => {
    it('when rendered, then shows the app name heading', () => {
      renderWithProviders(<LoginPage onGoToSignup={vi.fn()} />)
      expect(screen.getByRole('heading', { name: /todo app tdd/i })).toBeInTheDocument()
    })

    it('when rendered, then shows email input', () => {
      renderWithProviders(<LoginPage onGoToSignup={vi.fn()} />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('when rendered, then shows password input', () => {
      renderWithProviders(<LoginPage onGoToSignup={vi.fn()} />)
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    })

    it('when rendered, then shows Log in button', () => {
      renderWithProviders(<LoginPage onGoToSignup={vi.fn()} />)
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    })

    it('when rendered, then shows Sign up link', () => {
      renderWithProviders(<LoginPage onGoToSignup={vi.fn()} />)
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })
  })

  describe('Happy Path - Successful Login', () => {
    it('when valid credentials submitted, then sets isAuthenticated to true', async () => {
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LoginPage onGoToSignup={vi.fn()} />, { store })

      await user.type(screen.getByLabelText(/email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.click(screen.getByRole('button', { name: /log in/i }))

      expect(store.get(isAuthenticatedAtom)).toBe(true)
    })
  })

  describe('Error Cases - Validation', () => {
    it('when submitted with empty email, then shows email validation error', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage onGoToSignup={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /log in/i }))

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    })

    it('when submitted with invalid email, then shows email format error', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage onGoToSignup={vi.fn()} />)

      await user.type(screen.getByLabelText(/email/i), 'not-an-email')
      await user.click(screen.getByRole('button', { name: /log in/i }))

      expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument()
    })

    it('when submitted with empty password, then shows password validation error', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage onGoToSignup={vi.fn()} />)

      await user.type(screen.getByLabelText(/email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /log in/i }))

      expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
    })
  })

  describe('Interaction - Navigate to Signup', () => {
    it('when Sign up button clicked, then calls onGoToSignup', async () => {
      const user = userEvent.setup()
      const onGoToSignup = vi.fn()
      renderWithProviders(<LoginPage onGoToSignup={onGoToSignup} />)

      await user.click(screen.getByRole('button', { name: /sign up/i }))

      expect(onGoToSignup).toHaveBeenCalledOnce()
    })
  })
})
