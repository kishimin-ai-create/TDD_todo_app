import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'
import { AppCreatePage } from './AppCreatePage'

describe('AppCreatePage', () => {
  describe('Happy Path - Rendering', () => {
    it('when rendered, then shows page title "Create New App"', () => {
      // Arrange + Act
      renderWithProviders(<AppCreatePage />)

      // Assert
      expect(screen.getByText(/create new app/i)).toBeInTheDocument()
    })

    it('when rendered, then shows App Name input', () => {
      // Arrange + Act
      renderWithProviders(<AppCreatePage />)

      // Assert
      expect(screen.getByLabelText(/app name/i)).toBeInTheDocument()
    })

    it('when rendered, then shows Create submit button', () => {
      // Arrange + Act
      renderWithProviders(<AppCreatePage />)

      // Assert
      expect(
        screen.getByRole('button', { name: /create/i }),
      ).toBeInTheDocument()
    })

    it('when rendered, then shows Cancel button', () => {
      // Arrange + Act
      renderWithProviders(<AppCreatePage />)

      // Assert
      expect(
        screen.getByRole('button', { name: /cancel/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Happy Path - Successful Submission', () => {
    it('when form submitted with valid name, then calls POST /api/v1/apps', async () => {
      // Arrange
      const user = userEvent.setup()
      let postWasCalled = false
      server.use(
        http.post('/api/v1/apps', () => {
          postWasCalled = true
          return HttpResponse.json(
            {
              success: true,
              data: {
                id: 'new-app',
                name: 'New App',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            },
            { status: 201 },
          )
        }),
      )
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'New App')
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Assert
      await waitFor(() => expect(postWasCalled).toBe(true))
    })

    it('when POST succeeds, then navigates away from create page', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/apps', () =>
          HttpResponse.json(
            {
              success: true,
              data: {
                id: 'new-app',
                name: 'New App',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            },
            { status: 201 },
          ),
        ),
      )
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'New App')
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Assert — Create New App heading should disappear after navigation
      await waitFor(() => {
        expect(
          screen.queryByText(/create new app/i),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Cases - Duplicate Name (409)', () => {
    it('when POST returns 409, then shows conflict error alert', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/apps', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: {
                code: 'CONFLICT',
                message: 'App already exists',
              },
            },
            { status: 409 },
          ),
        ),
      )
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'Duplicate App')
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when POST returns 409, then stays on create page', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/apps', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: { code: 'CONFLICT', message: 'App already exists' },
            },
            { status: 409 },
          ),
        ),
      )
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'Duplicate App')
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Assert
      await screen.findByRole('alert')
      expect(screen.getByText(/create new app/i)).toBeInTheDocument()
    })
  })

  describe('Error Cases - Validation (422)', () => {
    it('when POST returns 422, then shows validation error alert', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/apps', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'App name is required',
              },
            },
            { status: 422 },
          ),
        ),
      )
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'a')
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('when form is submitting, then Create button is disabled', async () => {
      // Arrange
      const user = userEvent.setup()
      // Never resolve so we can observe the loading state
      server.use(
        http.post('/api/v1/apps', async () => {
          await new Promise(() => {}) // never resolves
        }),
      )
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'New App')
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Assert — AppForm shows "Loading..." on the button while the mutation is pending,
      // so we query by that accessible name.
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /loading/i }),
        ).toBeDisabled()
      })
    })
  })

  describe('Interaction - Cancel Navigation', () => {
    it('when Cancel button clicked, then navigates away from create page', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      // Assert — Create New App page heading should no longer be visible
      await waitFor(() => {
        expect(screen.queryByText(/create new app/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Boundary Cases - App Name Length', () => {
    it('when name has exactly 1 character (minimum), then POST is called on submit', async () => {
      // Arrange
      const user = userEvent.setup()
      let postWasCalled = false
      server.use(
        http.post('/api/v1/apps', () => {
          postWasCalled = true
          return HttpResponse.json(
            {
              success: true,
              data: {
                id: 'new-app',
                name: 'A',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            },
            { status: 201 },
          )
        }),
      )
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'A')
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Assert
      await waitFor(() => expect(postWasCalled).toBe(true))
    })

    it('when name has exactly 100 characters (maximum), then POST is called on submit', async () => {
      // Arrange
      const user = userEvent.setup()
      let postWasCalled = false
      server.use(
        http.post('/api/v1/apps', () => {
          postWasCalled = true
          return HttpResponse.json(
            {
              success: true,
              data: {
                id: 'new-app',
                name: 'a'.repeat(100),
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            },
            { status: 201 },
          )
        }),
      )
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'a'.repeat(100))
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Assert
      await waitFor(() => expect(postWasCalled).toBe(true))
    })

    it('when name has 101 characters (over maximum), then POST is NOT called', async () => {
      // Arrange
      const user = userEvent.setup()
      let postWasCalled = false
      server.use(
        http.post('/api/v1/apps', () => {
          postWasCalled = true
          return HttpResponse.json({}, { status: 201 })
        }),
      )
      renderWithProviders(<AppCreatePage />)

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'a'.repeat(101))
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Assert — validation should block the request
      await screen.findByRole('alert')
      expect(postWasCalled).toBe(false)
    })
  })
})
