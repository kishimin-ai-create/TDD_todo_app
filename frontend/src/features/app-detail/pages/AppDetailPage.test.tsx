import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { currentPageAtom } from '../../../shared/navigation'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'
import { AppDetailPage } from './AppDetailPage'

const mockApp = {
  id: 'app-1',
  name: 'My App',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
}

const mockTodos = [
  {
    id: 'todo-1',
    title: 'Todo One',
    completed: false,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    appId: 'app-1',
  },
]

describe('AppDetailPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/apps/app-1', () =>
        HttpResponse.json({ success: true, data: mockApp }),
      ),
      http.get('/api/v1/apps/app-1/todos', () =>
        HttpResponse.json({ success: true, data: mockTodos }),
      ),
    )
  })

  describe('Happy Path - Loading & Rendering', () => {
    it('when page loads, then shows app name after data fetches', async () => {
      // Arrange + Act
      renderWithProviders(<AppDetailPage appId="app-1" />)

      // Assert
      expect(await screen.findByText('My App')).toBeInTheDocument()
    })

    it('when page loads, then shows todos after data fetches', async () => {
      // Arrange + Act
      renderWithProviders(<AppDetailPage appId="app-1" />)

      // Assert
      expect(await screen.findByText('Todo One')).toBeInTheDocument()
    })

    it('when page loads, then shows Edit button in header', async () => {
      // Arrange + Act
      renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Assert — the page renders both AppHeader (Edit) and TodoItem (Edit) buttons;
      // getAllByRole handles the multiple matches without throwing.
      expect(
        screen.getAllByRole('button', { name: /edit/i }).length,
      ).toBeGreaterThan(0)
    })

    it('when page loads, then shows Delete button in header', async () => {
      // Arrange + Act
      renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Assert — similarly, multiple Delete buttons exist (AppHeader + TodoItem).
      expect(
        screen.getAllByRole('button', { name: /delete/i }).length,
      ).toBeGreaterThan(0)
    })

    it('when page loads, then shows Create Todo button', async () => {
      // Arrange + Act
      renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Assert
      expect(
        screen.getByRole('button', { name: /create todo/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Timestamps Display', () => {
    it('when page loads, then shows createdAt date', async () => {
      // Arrange + Act
      renderWithProviders(<AppDetailPage appId="app-1" />)

      // Assert
      expect(await screen.findByText(/2026-04-01/)).toBeInTheDocument()
    })
  })

  describe('Interaction - Delete App', () => {
    it('when Delete App button clicked, then shows confirmation dialog', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Act
      // AppHeader's Delete is the first Delete button in the DOM (before TodoItem's).
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0])

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('when delete is cancelled, then dialog closes and page stays unchanged', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Act
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      // Assert – dialog gone, app name still on page
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByText('My App')).toBeInTheDocument()
    })

    it('when delete confirmed, then calls DELETE API for the app', async () => {
      // Arrange
      const user = userEvent.setup()
      let deleteWasCalled = false
      server.use(
        http.delete('/api/v1/apps/app-1', () => {
          deleteWasCalled = true
          return HttpResponse.json({
            success: true,
            data: { id: 'app-1', name: 'My App', createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
          })
        }),
      )
      renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Act
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
      await user.click(screen.getByRole('button', { name: /confirm/i }))

      // Assert
      await waitFor(() => expect(deleteWasCalled).toBe(true))
    })

    it('when delete confirmed, then shows success toast with "App deleted successfully"', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.delete('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'app-1', name: 'My App', createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
          }),
        ),
      )
      renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Act
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
      await user.click(screen.getByRole('button', { name: /confirm/i }))

      // Assert — toast must appear after successful delete (not yet implemented → Red failure)
      expect(
        await screen.findByText(/app deleted successfully/i),
      ).toBeInTheDocument()
    })

    it('when delete confirmed, then navigates away from app detail', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.delete('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'app-1', name: 'My App', createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
          }),
        ),
      )
      const { store } = renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Act
      await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
      await user.click(screen.getByRole('button', { name: /confirm/i }))

      // Assert — after successful delete, goToAppList() must be called,
      // setting the currentPageAtom to { name: 'app-list' }.
      await waitFor(() => {
        expect(store.get(currentPageAtom)).toEqual({ name: 'app-list' })
      })
    })
  })

  describe('Interaction - Edit App Navigation', () => {
    it('when Edit button clicked, then navigates to app-edit page', async () => {
      // Arrange
      const user = userEvent.setup()
      const { store } = renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Act
      // AppHeader's Edit button is the first Edit button in DOM order.
      await user.click(screen.getAllByRole('button', { name: /edit/i })[0])

      // Assert — goToAppEdit('app-1') must set the atom to { name: 'app-edit', appId: 'app-1' }.
      await waitFor(() => {
        expect(store.get(currentPageAtom)).toEqual({ name: 'app-edit', appId: 'app-1' })
      })
    })
  })

  describe('Interaction - Create Todo', () => {
    it('when Create Todo button clicked, then shows inline create form', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(<AppDetailPage appId="app-1" />)
      await screen.findByText('My App')

      // Act
      await user.click(screen.getByRole('button', { name: /create todo/i }))

      // Assert
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('when app API returns 404, then shows not found error', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            { success: false, data: null, error: { code: 'NOT_FOUND', message: 'App not found' } },
            { status: 404 },
          ),
        ),
      )

      // Act
      renderWithProviders(<AppDetailPage appId="app-1" />)

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })
  })
})
