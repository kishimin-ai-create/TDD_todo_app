import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { isAuthenticatedAtom } from '../../../shared/auth'
import { currentPageAtom } from '../../../shared/navigation'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  describe('Rendering', () => {
    it('when rendered, then shows login heading', () => {
      renderWithProviders(<LoginPage />)
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    })

    it('when rendered, then shows email input', () => {
      renderWithProviders(<LoginPage />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('when rendered, then shows password input', () => {
      renderWithProviders(<LoginPage />)
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    })

    it('when rendered, then shows login submit button', () => {
      renderWithProviders(<LoginPage />)
      expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument()
    })

    it('when rendered, then shows sign up link button', () => {
      renderWithProviders(<LoginPage />)
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('when submitted with empty fields, then shows error message', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      await user.click(screen.getByRole('button', { name: /^login$/i }))

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Success flow', () => {
    it('when submitted with valid credentials, then sets isAuthenticated to true', async () => {
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /^login$/i }))

      expect(store.get(isAuthenticatedAtom)).toBe(true)
    })

    it('when submitted with valid credentials, then navigates to app list', async () => {
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /^login$/i }))

      expect(store.get(currentPageAtom)).toEqual({ name: 'app-list' })
    })
  })

  describe('Navigation', () => {
    it('when Sign Up button clicked, then navigates to signup page', async () => {
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      await user.click(screen.getByRole('button', { name: /sign up/i }))

      expect(store.get(currentPageAtom)).toEqual({ name: 'signup' })
    })
  })
})
