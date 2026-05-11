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

    it('when rendered, then email input value is empty initially', () => {
      // Arrange + Act
      renderWithProviders(<SignupPage />)

      // Assert
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      expect((emailInput as HTMLInputElement).value).toBe('')
    })

    it('when rendered, then password input value is empty initially', () => {
      // Arrange + Act
      renderWithProviders(<SignupPage />)

      // Assert
      const passwordInput = screen.getByLabelText(/password/i)
      expect((passwordInput as HTMLInputElement).value).toBe('')
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

    it('when valid registration info is submitted, then email and password input fields are cleared', async () => {
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
      renderWithProviders(<SignupPage />)

      // Act
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      await waitFor(() => {
        expect((emailInput as HTMLInputElement).value).toBe('')
        expect((passwordInput as HTMLInputElement).value).toBe('')
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

    it('when signup succeeds with 201 status, then authAtom is populated and page navigates to app-list', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/signup', () =>
          HttpResponse.json(
            {
              success: true,
              data: {
                token: 'test-token',
                user: { id: 'user-1', email: 'test@example.com' },
              },
            },
            { status: 201 },
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
        expect(store.get(authAtom)).toEqual({
          token: 'test-token',
          user: { id: 'user-1', email: 'test@example.com' },
        })
        expect(store.get(currentPageAtom)).toEqual({ name: 'app-list' })
      })
    })

    it('when signup API returns 200 with object-style error body, then error message from body is displayed', async () => {
      // Arrange — simulates a proxy that converts backend 4xx to 200, preserving the JSON body
      // { success: false, error: { code, message } } is the backend's validation error shape
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/signup', () =>
          HttpResponse.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters.' },
            },
            { status: 200 },
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
      expect(await screen.findByRole('alert')).toHaveTextContent('Password must be at least 8 characters.')
    })

    it('when signup API returns 422 with object-style error body, then error message from body is displayed', async () => {
      // Arrange — the actual backend validation error shape: 422 + { success: false, error: { code, message } }
      // This exercises the extractErrorMessage path (response.ok is false for 422).
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/auth/signup', () =>
          HttpResponse.json(
            {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters.' },
            },
            { status: 422 },
          ),
        ),
      )
      renderWithProviders(<SignupPage />)

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), 'short')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      expect(await screen.findByRole('alert')).toHaveTextContent('Password must be at least 8 characters.')
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

    it('when password is whitespace only, then error is displayed without calling API', async () => {
      // Arrange
      const user = userEvent.setup()
      let apiWasCalled = false
      server.use(
        http.post('/api/v1/auth/signup', () => {
          apiWasCalled = true
          return HttpResponse.json({ success: false, error: 'Should not be called' })
        }),
      )
      renderWithProviders(<SignupPage />)

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), '        ')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(apiWasCalled).toBe(false)
    })

    it('when password has leading and trailing whitespace, then password is trimmed before sending to API', async () => {
      // Arrange
      const user = userEvent.setup()
      let capturedPassword: string | null = null
      server.use(
        http.post('/api/v1/auth/signup', async (req) => {
          const body = await req.request.json() as { password?: string }
          capturedPassword = body.password ?? null
          return HttpResponse.json({
            success: true,
            data: {
              token: 'test-token',
              user: { id: 'user-1', email: 'test@example.com' },
            },
          })
        }),
      )
      renderWithProviders(<SignupPage />)

      // Act
      await user.type(
        screen.getByRole('textbox', { name: /email/i }),
        'test@example.com',
      )
      await user.type(screen.getByLabelText(/password/i), ' password123 ')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      await waitFor(() => {
        expect(capturedPassword).toBe('password123')
      })
    })
  })
})
