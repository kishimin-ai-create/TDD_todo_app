import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { isAuthenticatedAtom } from '../../../shared/auth'
import { currentPageAtom } from '../../../shared/navigation'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { SignupPage } from './SignupPage'

describe('SignupPage', () => {
  describe('Rendering', () => {
    it('when rendered, then shows sign up heading', () => {
      renderWithProviders(<SignupPage />)
      expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument()
    })

    it('when rendered, then shows email input', () => {
      renderWithProviders(<SignupPage />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('when rendered, then shows password input', () => {
      renderWithProviders(<SignupPage />)
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    })

    it('when rendered, then shows confirm password input', () => {
      renderWithProviders(<SignupPage />)
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('when rendered, then shows sign up submit button', () => {
      renderWithProviders(<SignupPage />)
      expect(screen.getByRole('button', { name: /^sign up$/i })).toBeInTheDocument()
    })

    it('when rendered, then shows login link button', () => {
      renderWithProviders(<SignupPage />)
      expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('when submitted with empty fields, then shows error message', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SignupPage />)

      await user.click(screen.getByRole('button', { name: /^sign up$/i }))

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('when submitted with mismatched passwords, then shows error message', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SignupPage />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'different')
      await user.click(screen.getByRole('button', { name: /^sign up$/i }))

      expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i)
    })
  })

  describe('Success flow', () => {
    it('when submitted with valid matching credentials, then sets isAuthenticated to true', async () => {
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<SignupPage />, { store })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /^sign up$/i }))

      expect(store.get(isAuthenticatedAtom)).toBe(true)
    })

    it('when submitted with valid matching credentials, then navigates to app list', async () => {
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<SignupPage />, { store })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /^sign up$/i }))

      expect(store.get(currentPageAtom)).toEqual({ name: 'app-list' })
    })
  })

  describe('Navigation', () => {
    it('when Login button clicked, then navigates to login page', async () => {
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<SignupPage />, { store })

      await user.click(screen.getByRole('button', { name: /^login$/i }))

      expect(store.get(currentPageAtom)).toEqual({ name: 'login' })
    })
  })
})
