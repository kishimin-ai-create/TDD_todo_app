import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'
import { AppEditPage } from './AppEditPage'

describe('AppEditPage', () => {
  describe('Happy Path - Pre-filled Form', () => {
    it('when page loads, then form is pre-filled with current app name', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
      )

      // Act
      renderWithProviders(<AppEditPage appId="app-1" />)

      // Assert
      expect(await screen.findByDisplayValue('Existing App')).toBeInTheDocument()
    })

    it('when page loads, then shows Edit App heading', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
      )

      // Act
      renderWithProviders(<AppEditPage appId="app-1" />)

      // Assert
      expect(await screen.findByText(/edit app/i)).toBeInTheDocument()
    })

    it('when page loads, then shows Update submit button', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
      )

      // Act
      renderWithProviders(<AppEditPage appId="app-1" />)
      await screen.findByDisplayValue('Existing App')

      // Assert
      expect(
        screen.getByRole('button', { name: /update/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Happy Path - Successful Update', () => {
    it('when Update clicked with valid name, then calls PUT /api/v1/apps/app-1', async () => {
      // Arrange
      const user = userEvent.setup()
      let putWasCalled = false
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
        http.put('/api/v1/apps/app-1', () => {
          putWasCalled = true
          return HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Updated App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-02T00:00:00Z',
            },
          })
        }),
      )
      renderWithProviders(<AppEditPage appId="app-1" />)
      await screen.findByDisplayValue('Existing App')

      // Act
      await user.clear(screen.getByLabelText(/app name/i))
      await user.type(screen.getByLabelText(/app name/i), 'Updated App')
      await user.click(screen.getByRole('button', { name: /update/i }))

      // Assert
      await waitFor(() => expect(putWasCalled).toBe(true))
    })

    it('when PUT succeeds, then navigates to app-detail', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Updated App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-02T00:00:00Z',
            },
          }),
        ),
      )
      renderWithProviders(<AppEditPage appId="app-1" />)
      await screen.findByDisplayValue('Existing App')

      // Act
      await user.clear(screen.getByLabelText(/app name/i))
      await user.type(screen.getByLabelText(/app name/i), 'Updated App')
      await user.click(screen.getByRole('button', { name: /update/i }))

      // Assert — Edit App heading should disappear after navigation
      await waitFor(() => {
        expect(screen.queryByText(/edit app/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Cases - Duplicate Name (409)', () => {
    it('when PUT returns 409, then shows conflict error alert', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: { code: 'CONFLICT', message: 'App name already exists' },
            },
            { status: 409 },
          ),
        ),
      )
      renderWithProviders(<AppEditPage appId="app-1" />)
      await screen.findByDisplayValue('Existing App')

      // Act
      await user.clear(screen.getByLabelText(/app name/i))
      await user.type(screen.getByLabelText(/app name/i), 'Duplicate App')
      await user.click(screen.getByRole('button', { name: /update/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when PUT returns 409, then stays on edit page', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: { code: 'CONFLICT', message: 'App name already exists' },
            },
            { status: 409 },
          ),
        ),
      )
      renderWithProviders(<AppEditPage appId="app-1" />)
      await screen.findByDisplayValue('Existing App')

      // Act
      await user.clear(screen.getByLabelText(/app name/i))
      await user.type(screen.getByLabelText(/app name/i), 'Duplicate App')
      await user.click(screen.getByRole('button', { name: /update/i }))

      // Assert
      await screen.findByRole('alert')
      expect(screen.getByText(/edit app/i)).toBeInTheDocument()
    })
  })

  describe('Validation Errors', () => {
    it('when name is cleared and Update clicked, then shows required error', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
      )
      renderWithProviders(<AppEditPage appId="app-1" />)
      await screen.findByDisplayValue('Existing App')

      // Act
      await user.clear(screen.getByLabelText(/app name/i))
      await user.click(screen.getByRole('button', { name: /update/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when name exceeds 100 characters and Update clicked, then shows max length error', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
      )
      renderWithProviders(<AppEditPage appId="app-1" />)
      await screen.findByDisplayValue('Existing App')

      // Act
      await user.clear(screen.getByLabelText(/app name/i))
      await user.type(screen.getByLabelText(/app name/i), 'a'.repeat(101))
      await user.click(screen.getByRole('button', { name: /update/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Interaction - Cancel Navigation', () => {
    it('when Cancel clicked, then navigates back to app-detail', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'app-1',
              name: 'Existing App',
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
            },
          }),
        ),
      )
      renderWithProviders(<AppEditPage appId="app-1" />)
      await screen.findByDisplayValue('Existing App')

      // Act
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      // Assert — Edit App heading should disappear after navigation
      await waitFor(() => {
        expect(screen.queryByText(/edit app/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Cases - GET Returns 404', () => {
    it('when GET /api/v1/apps/:id returns 404, then shows error message instead of loading', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: { code: 'NOT_FOUND' },
            },
            { status: 404 },
          ),
        ),
      )

      // Act
      renderWithProviders(<AppEditPage appId="app-1" />)

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/app not found/i)).toBeInTheDocument()
    })

    it('when GET /api/v1/apps/:id returns 500, then shows error message instead of loading', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: { code: 'SERVER_ERROR' },
            },
            { status: 500 },
          ),
        ),
      )

      // Act
      renderWithProviders(<AppEditPage appId="app-1" />)

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/app not found/i)).toBeInTheDocument()
    })

    it('when GET /api/v1/apps/:id returns 403, then shows error message instead of loading', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: { code: 'FORBIDDEN' },
            },
            { status: 403 },
          ),
        ),
      )

      // Act
      renderWithProviders(<AppEditPage appId="app-1" />)

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/app not found/i)).toBeInTheDocument()
    })
  })
})
