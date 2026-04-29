import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'
import { TodoItem } from './TodoItem'

const mockTodo = {
  id: 'todo-1',
  title: 'Test Todo',
  completed: false,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  appId: 'app-1',
}

const completedTodo = {
  ...mockTodo,
  completed: true,
}

describe('TodoItem', () => {
  describe('Happy Path - Rendering', () => {
    it('when rendered, then shows todo title', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(screen.getByText('Test Todo')).toBeInTheDocument()
    })

    it('when todo is pending, then checkbox is unchecked', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    it('when todo is completed, then checkbox is checked', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoItem todo={completedTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('when rendered, then shows Edit button', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    it('when rendered, then shows Delete button', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(
        screen.getByRole('button', { name: /delete/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Interaction - Edit Mode', () => {
    it('when Edit button clicked, then shows inline edit form with textbox', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /edit/i }))

      // Assert
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('when Edit button clicked, then textbox is pre-filled with todo title', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /edit/i }))

      // Assert
      expect(screen.getByRole('textbox')).toHaveValue('Test Todo')
    })

    it('when in edit mode, then shows Cancel button', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /edit/i }))

      // Assert
      expect(
        screen.getByRole('button', { name: /cancel/i }),
      ).toBeInTheDocument()
    })

    it('when in edit mode, then shows Save button', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /edit/i }))

      // Assert
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })
  })

  describe('Interaction - Delete with Confirmation', () => {
    it('when Delete button clicked, then shows confirmation dialog', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('when delete confirmed, then calls DELETE API and invokes onRefresh', async () => {
      // Arrange
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      server.use(
        http.delete('/api/v1/apps/app-1/todos/todo-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'todo-1',
              title: 'Test Todo',
              completed: false,
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
              appId: 'app-1',
            },
          }),
        ),
      )
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={onRefresh} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))
      await user.click(screen.getByRole('button', { name: /confirm/i }))

      // Assert
      await waitFor(() => expect(onRefresh).toHaveBeenCalled())
    })

    it('when delete confirmed, then shows success toast "Todo deleted successfully"', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.delete('/api/v1/apps/app-1/todos/todo-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'todo-1',
              title: 'Test Todo',
              completed: false,
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
              appId: 'app-1',
            },
          }),
        ),
      )
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))
      await user.click(screen.getByRole('button', { name: /confirm/i }))

      // Assert
      expect(
        await screen.findByText(/todo deleted successfully/i),
      ).toBeInTheDocument()
    })

    it('when delete cancelled, then dialog closes without calling onRefresh', async () => {
      // Arrange
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={onRefresh} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      // Assert
      expect(onRefresh).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Interaction - Checkbox Toggle', () => {
    it('when checkbox clicked on pending todo, then calls PATCH/PUT API to mark completed', async () => {
      // Arrange
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      server.use(
        http.put('/api/v1/apps/app-1/todos/todo-1', () =>
          HttpResponse.json({
            success: true,
            data: { ...mockTodo, completed: true },
          }),
        ),
      )
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={onRefresh} />,
      )

      // Act
      await user.click(screen.getByRole('checkbox'))

      // Assert
      await waitFor(() => expect(onRefresh).toHaveBeenCalled())
    })
  })

  describe('Error Cases - Failed Delete (4xx/5xx)', () => {
    it('when DELETE returns 404, then does NOT show success message', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.delete('/api/v1/apps/app-1/todos/todo-1', () =>
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
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))
      await user.click(screen.getByRole('button', { name: /confirm/i }))

      // Assert
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(screen.queryByText(/todo deleted successfully/i)).not.toBeInTheDocument()
    })

    it('when DELETE returns 404, then does NOT call onRefresh', async () => {
      // Arrange
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      server.use(
        http.delete('/api/v1/apps/app-1/todos/todo-1', () =>
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
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={onRefresh} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))
      await user.click(screen.getByRole('button', { name: /confirm/i }))

      // Assert
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(onRefresh).not.toHaveBeenCalled()
    })

    it('when DELETE returns 500, then does NOT show success message', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.delete('/api/v1/apps/app-1/todos/todo-1', () =>
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
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))
      await user.click(screen.getByRole('button', { name: /confirm/i }))

      // Assert
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(screen.queryByText(/todo deleted successfully/i)).not.toBeInTheDocument()
    })

    it('when DELETE returns 422, then does NOT call onRefresh', async () => {
      // Arrange
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      server.use(
        http.delete('/api/v1/apps/app-1/todos/todo-1', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: { code: 'VALIDATION_ERROR' },
            },
            { status: 422 },
          ),
        ),
      )
      renderWithProviders(
        <TodoItem todo={mockTodo} appId="app-1" onRefresh={onRefresh} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))
      await user.click(screen.getByRole('button', { name: /confirm/i }))

      // Assert
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(onRefresh).not.toHaveBeenCalled()
    })
  })
})
