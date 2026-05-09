import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { authAtom } from '../../../shared/auth'
import { currentPageAtom } from '../../../shared/navigation'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'
import { SignupPage } from './SignupPage'

describe('SignupPage', () => {
  beforeEach(() => {
    // atomWithStorage syncs to localStorage; clear between tests to avoid cross-contamination
    localStorage.clear()
  })

  describe('Content - Form Fields', () => {
    it('when rendered, then email input field is displayed', () => {
      // Arrange + Act
      renderWithProviders(<SignupPage />)

      // Assert
      expect(
        screen.getByRole('textbox', { name: /email/i }),
      ).toBeInTheDocument()
    })

    it('when rendered, then password input field is displayed', () => {
      // Arrange + Act
      renderWithProviders(<SignupPage />)

      // Assert
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('when rendered, then Sign Up button is displayed', () => {
      // Arrange + Act
      renderWithProviders(<SignupPage />)

      // Assert
      expect(
        screen.getByRole('button', { name: /sign up/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Happy Path - Successful Signup', () => {
    it('when valid registration info is submitted, then authAtom is populated and page navigates to app-list', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/signup', () =>
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
      renderWithProviders(<SignupPage />, { store })

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      await waitFor(() => {
        expect(store.get(authAtom)).toEqual({
          token: 'test-token',
          user: { id: 'user-1', email: 'test@example.com' },
        })
        expect(store.get(currentPageAtom)).toEqual({ name: 'app-list' })
      })
    })
  })

  describe('Navigation - Login Link', () => {
    it('when Login link is clicked, then currentPageAtom becomes { name: "login" }', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<SignupPage />, { store })

      // Act
      await user.click(screen.getByRole('button', { name: /login/i }))

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'login' })
    })
  })

  describe('Error Handling - Signup Failure', () => {
    it('when signup request fails, then an error alert is displayed', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/signup', () =>
          HttpResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 },
          ),
        ),
      )
      renderWithProviders(<SignupPage />)

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when signup request fails, then authAtom remains null', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/signup', () =>
          HttpResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 },
          ),
        ),
      )
      const store = createStore()
      renderWithProviders(<SignupPage />, { store })

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      expect(store.get(authAtom)).toBeNull()
    })

    it('when the network request fails, then an error alert is displayed', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/signup', () => HttpResponse.error()),
      )
      renderWithProviders(<SignupPage />)

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when auth API returns non-JSON error body, then fallback error is displayed', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/signup', () => new HttpResponse('Not Found', { status: 404 })),
      )
      renderWithProviders(<SignupPage />)

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      expect(await screen.findByRole('alert')).toHaveTextContent('Sign up failed')
    })
  })
})
