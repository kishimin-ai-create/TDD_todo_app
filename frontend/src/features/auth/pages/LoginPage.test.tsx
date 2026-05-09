import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { authAtom } from '../../../shared/auth'
import { currentPageAtom } from '../../../shared/navigation'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  beforeEach(() => {
    // atomWithStorage syncs to localStorage; clear between tests to avoid cross-contamination
    localStorage.clear()
  })

  describe('Content - Form Fields', () => {
    it('when rendered, then email input field is displayed', () => {
      // Arrange + Act
      renderWithProviders(<LoginPage />)

      // Assert
      expect(
        screen.getByRole('textbox', { name: /email/i }),
      ).toBeInTheDocument()
    })

    it('when rendered, then password input field is displayed', () => {
      // Arrange + Act
      renderWithProviders(<LoginPage />)

      // Assert
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('when rendered, then Login button is displayed', () => {
      // Arrange + Act
      renderWithProviders(<LoginPage />)

      // Assert
      expect(
        screen.getByRole('button', { name: /login/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Happy Path - Successful Login', () => {
    it('when valid credentials are submitted, then authAtom is set with the returned token', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/login', () =>
          HttpResponse.json({
            success: true,
            data: {
              token: 'test-token',
              user: { id: 'user-1', email: 'test@example.com' },
            },
          }),
        ),
      )
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      // Assert
      await waitFor(() => {
        const auth = store.get(authAtom)
        expect(auth?.token).toBe('test-token')
      })
    })

    it('when valid credentials are submitted, then authAtom contains the correct user email', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/login', () =>
          HttpResponse.json({
            success: true,
            data: {
              token: 'test-token',
              user: { id: 'user-1', email: 'test@example.com' },
            },
          }),
        ),
      )
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      // Assert
      await waitFor(() => {
        const auth = store.get(authAtom)
        expect(auth?.user.email).toBe('test@example.com')
      })
    })
  })

  describe('Navigation - Sign Up Link', () => {
    it('when Sign Up link is clicked, then currentPageAtom becomes { name: "signup" }', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      // Act
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'signup' })
    })
  })

  describe('Error Handling - Login Failure', () => {
    it('when credentials are invalid, then an error alert is displayed', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/login', () =>
          HttpResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 },
          ),
        ),
      )
      renderWithProviders(<LoginPage />)

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'wrong@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /login/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when credentials are invalid, then authAtom remains null', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/login', () =>
          HttpResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 },
          ),
        ),
      )
      const store = createStore()
      renderWithProviders(<LoginPage />, { store })

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'wrong@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /login/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      expect(store.get(authAtom)).toBeNull()
    })
  })
})
