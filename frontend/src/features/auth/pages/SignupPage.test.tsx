import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { describe, expect, it, vi } from 'vitest'

import { isAuthenticatedAtom } from '../../../shared/auth'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { SignupPage } from './SignupPage'

describe('SignupPage', () => {
  describe('Happy Path - Rendering', () => {
    it('when rendered, then shows the app name heading', () => {
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />)
      expect(screen.getByRole('heading', { name: /todo app tdd/i })).toBeInTheDocument()
    })

    it('when rendered, then shows email input', () => {
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('when rendered, then shows password input', () => {
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />)
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    })

    it('when rendered, then shows confirm password input', () => {
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />)
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('when rendered, then shows Sign up button', () => {
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />)
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('when rendered, then shows Log in link', () => {
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />)
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    })
  })

  describe('Happy Path - Successful Signup', () => {
    it('when valid credentials submitted, then sets isAuthenticated to true', async () => {
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />, { store })

      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      expect(store.get(isAuthenticatedAtom)).toBe(true)
    })
  })

  describe('Error Cases - Validation', () => {
    it('when submitted with empty email, then shows email validation error', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: /sign up/i }))

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    })

    it('when submitted with password shorter than 8 chars, then shows length error', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />)

      await user.type(screen.getByLabelText(/email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'short')
      await user.type(screen.getByLabelText(/confirm password/i), 'short')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
    })

    it('when passwords do not match, then shows mismatch error', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SignupPage onGoToLogin={vi.fn()} />)

      await user.type(screen.getByLabelText(/email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'different456')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  describe('Interaction - Navigate to Login', () => {
    it('when Log in button clicked, then calls onGoToLogin', async () => {
      const user = userEvent.setup()
      const onGoToLogin = vi.fn()
      renderWithProviders(<SignupPage onGoToLogin={onGoToLogin} />)

      await user.click(screen.getByRole('button', { name: /log in/i }))

      expect(onGoToLogin).toHaveBeenCalledOnce()
    })
  })
})
