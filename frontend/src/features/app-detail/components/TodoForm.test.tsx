import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { server } from '../../../test/server'
import { TodoForm } from './TodoForm'

const mockTodo = {
  id: 'todo-1',
  title: 'Existing Todo',
  completed: false,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  appId: 'app-1',
}

describe('TodoForm - edit mode', () => {
  describe('Happy Path - Pre-filled Form', () => {
    it('when in edit mode, then title field is pre-filled with existing title', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Assert
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue(
        'Existing Todo',
      )
    })

    it('when in edit mode, then status field is read-only (disabled)', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Assert
      expect(screen.getByLabelText(/status/i)).toBeDisabled()
    })

    it('when in edit mode, then Save button is visible', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Assert
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('when in edit mode, then Cancel button is visible', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Assert
      expect(
        screen.getByRole('button', { name: /cancel/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Interaction - Cancel', () => {
    it('when Cancel clicked, then calls onCancel without saving', async () => {
      // Arrange
      const user = userEvent.setup()
      const onCancel = vi.fn()

      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={onCancel}
          onSuccess={vi.fn()}
        />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      // Assert
      expect(onCancel).toHaveBeenCalledOnce()
    })
  })

  describe('Validation Errors - Empty Title', () => {
    it('when title is cleared and Save clicked, then shows validation error alert', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Act
      await user.clear(screen.getByRole('textbox', { name: /title/i }))
      await user.click(screen.getByRole('button', { name: /save/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when title is cleared and Save clicked, then onSuccess is NOT called', async () => {
      // Arrange
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={onSuccess}
        />,
      )

      // Act
      await user.clear(screen.getByRole('textbox', { name: /title/i }))
      await user.click(screen.getByRole('button', { name: /save/i }))

      // Assert
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Interaction - Save calls PUT API (edit mode)', () => {
    it('when title edited and Save clicked in edit mode, then calls PUT API', async () => {
      // Arrange
      const user = userEvent.setup()
      let putWasCalled = false
      server.use(
        http.put('/api/v1/apps/app-1/todos/todo-1', () => {
          putWasCalled = true
          return HttpResponse.json({
            success: true,
            data: { ...mockTodo, title: 'Updated Todo' },
          })
        }),
      )
      const onSuccess = vi.fn()
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={onSuccess}
        />,
      )

      // Act
      await user.clear(screen.getByRole('textbox', { name: /title/i }))
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Updated Todo')
      await user.click(screen.getByRole('button', { name: /save/i }))

      // Assert
      await waitFor(() => expect(putWasCalled).toBe(true))
    })

    it('when save succeeds in edit mode, then calls onSuccess callback', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/apps/app-1/todos/todo-1', () =>
          HttpResponse.json({
            success: true,
            data: { ...mockTodo, title: 'Updated Todo' },
          }),
        ),
      )
      const onSuccess = vi.fn()
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={onSuccess}
        />,
      )

      // Act
      await user.clear(screen.getByRole('textbox', { name: /title/i }))
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Updated Todo')
      await user.click(screen.getByRole('button', { name: /save/i }))

      // Assert
      await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    })

    it('when Save is in flight in edit mode, then Save button is disabled', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.put('/api/v1/apps/app-1/todos/todo-1', async () => {
          await new Promise(() => {}) // never resolves
        }),
      )
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Act
      await user.clear(screen.getByRole('textbox', { name: /title/i }))
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Updated Todo')
      await user.click(screen.getByRole('button', { name: /save/i }))

      // Assert
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled(),
      )
    })
  })

  describe('Boundary Cases - Title Length', () => {
    it('when title exceeds 255 characters, then shows max length validation error', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Act
      await user.clear(screen.getByRole('textbox', { name: /title/i }))
      await user.type(
        screen.getByRole('textbox', { name: /title/i }),
        'a'.repeat(256),
      )
      await user.click(screen.getByRole('button', { name: /save/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })
  })
})

describe('TodoForm - create mode', () => {
  describe('Happy Path - Empty Form', () => {
    it('when in create mode, then title field is empty', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoForm
          mode="create"
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Assert
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('')
    })

    it('when in create mode, then status defaults to not completed (unchecked)', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoForm
          mode="create"
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Assert
      expect(screen.getByLabelText(/completed/i)).not.toBeChecked()
    })

    it('when in create mode, then Create / Save button is visible', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoForm
          mode="create"
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Assert
      expect(
        screen.getByRole('button', { name: /save|create/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Validation Errors - Empty Title on Create', () => {
    it('when title is empty and Save clicked, then shows required validation error', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <TodoForm
          mode="create"
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /save|create/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Interaction - Save calls POST API (create mode)', () => {
    it('when title entered and Save clicked in create mode, then calls POST API', async () => {
      // Arrange
      const user = userEvent.setup()
      let postWasCalled = false
      server.use(
        http.post('/api/v1/apps/app-1/todos', () => {
          postWasCalled = true
          return HttpResponse.json(
            {
              success: true,
              data: {
                id: 'new-todo',
                appId: 'app-1',
                title: 'Brand New Todo',
                completed: false,
                createdAt: '2026-04-12T10:00:00Z',
                updatedAt: '2026-04-12T10:00:00Z',
              },
            },
            { status: 201 },
          )
        }),
      )
      const onSuccess = vi.fn()
      renderWithProviders(
        <TodoForm
          mode="create"
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={onSuccess}
        />,
      )

      // Act
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Brand New Todo')
      await user.click(screen.getByRole('button', { name: /save|create/i }))

      // Assert
      await waitFor(() => expect(postWasCalled).toBe(true))
    })

    it('when POST succeeds in create mode, then calls onSuccess callback', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json(
            {
              success: true,
              data: {
                id: 'new-todo',
                appId: 'app-1',
                title: 'Brand New Todo',
                completed: false,
                createdAt: '2026-04-12T10:00:00Z',
                updatedAt: '2026-04-12T10:00:00Z',
              },
            },
            { status: 201 },
          ),
        ),
      )
      const onSuccess = vi.fn()
      renderWithProviders(
        <TodoForm
          mode="create"
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={onSuccess}
        />,
      )

      // Act
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Brand New Todo')
      await user.click(screen.getByRole('button', { name: /save|create/i }))

      // Assert
      await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    })

    it('when POST is in flight in create mode, then Save button is disabled', async () => {
      // Arrange
      const user = userEvent.setup()
      server.use(
        http.post('/api/v1/apps/app-1/todos', async () => {
          await new Promise(() => {}) // never resolves
        }),
      )
      renderWithProviders(
        <TodoForm
          mode="create"
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )

      // Act
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Brand New Todo')
      await user.click(screen.getByRole('button', { name: /save|create/i }))

      // Assert
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /loading/i }),
        ).toBeDisabled(),
      )
    })
  })

  describe('Error Cases - Failed PUT (4xx/5xx)', () => {
    it('when PUT returns 422 (validation error), then onSuccess is NOT called', async () => {
      // Arrange
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      server.use(
        http.put('/api/v1/apps/app-1/todos/todo-1', () =>
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
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={onSuccess}
        />,
      )

      // Act
      await user.clear(screen.getByRole('textbox', { name: /title/i }))
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Updated Todo')
      await user.click(screen.getByRole('button', { name: /save/i }))

      // Assert
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('when POST returns 409 (conflict), then onSuccess is NOT called', async () => {
      // Arrange
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      server.use(
        http.post('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: { code: 'CONFLICT' },
            },
            { status: 409 },
          ),
        ),
      )
      renderWithProviders(
        <TodoForm
          mode="create"
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={onSuccess}
        />,
      )

      // Act
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Brand New Todo')
      await user.click(screen.getByRole('button', { name: /save|create/i }))

      // Assert
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('when PUT returns 500, then onSuccess is NOT called', async () => {
      // Arrange
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      server.use(
        http.put('/api/v1/apps/app-1/todos/todo-1', () =>
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
        <TodoForm
          mode="edit"
          todo={mockTodo}
          appId="app-1"
          onCancel={vi.fn()}
          onSuccess={onSuccess}
        />,
      )

      // Act
      await user.clear(screen.getByRole('textbox', { name: /title/i }))
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'Updated Todo')
      await user.click(screen.getByRole('button', { name: /save/i }))

      // Assert
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })
})
