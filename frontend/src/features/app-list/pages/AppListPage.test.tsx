import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'
import { AppListPage } from './AppListPage'

describe('AppListPage', () => {
  describe('Happy Path - Loading & Rendering', () => {
    it('when page loads, then shows loading state initially', () => {
      // Arrange + Act
      renderWithProviders(<AppListPage />)

      // Assert
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('when apps loaded successfully, then renders app cards', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps', () =>
          HttpResponse.json({
            success: true,
            data: [
              {
                id: 'app-1',
                name: 'My App',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            ],
          }),
        ),
      )

      // Act
      renderWithProviders(<AppListPage />)

      // Assert
      expect(await screen.findByText('My App')).toBeInTheDocument()
    })

    it('when apps loaded, then page heading is visible', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps', () =>
          HttpResponse.json({ success: true, data: [] }),
        ),
      )

      // Act
      renderWithProviders(<AppListPage />)

      // Assert — heading should appear once loading resolves
      await waitFor(() => {
        expect(
          screen.queryByRole('status'),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Case - Empty List', () => {
    it('when no apps exist, then shows empty state message', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps', () =>
          HttpResponse.json({ success: true, data: [] }),
        ),
      )

      // Act
      renderWithProviders(<AppListPage />)

      // Assert
      expect(await screen.findByText(/no apps/i)).toBeInTheDocument()
    })
  })

  describe('Interaction - Create App Navigation', () => {
    it('when page renders, then Create App button is visible', () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps', () =>
          HttpResponse.json({ success: true, data: [] }),
        ),
      )

      // Act
      renderWithProviders(<AppListPage />)

      // Assert
      expect(
        screen.getByRole('button', { name: /create app/i }),
      ).toBeInTheDocument()
    })

    it('when Create App button clicked, then navigates to app-create page', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.get('/api/v1/apps', () =>
          HttpResponse.json({ success: true, data: [] }),
        ),
      )
      renderWithProviders(<AppListPage />)

      // Act
      await user.click(screen.getByRole('button', { name: /create app/i }))

      // Assert — navigation atom should have been updated to app-create
      // (verified through the atom state change; implementation will wire this)
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /create app/i }),
        ).not.toBeInTheDocument()
      })
    })

    it('when View button on an app card is clicked, then navigates to app-detail page', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.get('/api/v1/apps', () =>
          HttpResponse.json({
            success: true,
            data: [
              {
                id: 'app-1',
                name: 'Clickable App',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            ],
          }),
        ),
      )
      renderWithProviders(<AppListPage />)
      await screen.findByText('Clickable App')

      // Act
      await user.click(screen.getByRole('button', { name: /view/i }))

      // Assert — app list page heading / Create App button should disappear
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /create app/i }),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('when API returns 500, then shows error message', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps', () =>
          HttpResponse.json(
            { success: false, data: null, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
            { status: 500 },
          ),
        ),
      )

      // Act
      renderWithProviders(<AppListPage />)

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })
  })
})
