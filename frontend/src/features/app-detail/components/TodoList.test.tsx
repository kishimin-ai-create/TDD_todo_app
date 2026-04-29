import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { TodoList } from './TodoList'

const mockTodos = [
  {
    id: 'todo-1',
    title: 'Todo One',
    completed: false,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    appId: 'app-1',
  },
  {
    id: 'todo-2',
    title: 'Todo Two',
    completed: true,
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-02T00:00:00Z',
    appId: 'app-1',
  },
]

describe('TodoList', () => {
  describe('Happy Path - Multiple Todos', () => {
    it('when todos provided, then renders each todo item', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoList todos={mockTodos} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(screen.getByText('Todo One')).toBeInTheDocument()
      expect(screen.getByText('Todo Two')).toBeInTheDocument()
    })

    it('when todos provided, then renders correct number of edit buttons', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoList todos={mockTodos} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2)
    })

    it('when todos provided, then renders correct number of delete buttons', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoList todos={mockTodos} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(2)
    })

    it('when completed todo provided, then its checkbox is checked', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoList todos={mockTodos} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert — there are two checkboxes; one should be checked (Todo Two)
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.some((cb) => (cb as HTMLInputElement).checked)).toBe(true)
    })
  })

  describe('Edge Case - Empty List', () => {
    it('when no todos, then shows empty state message', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoList todos={[]} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(screen.getByText(/no todos/i)).toBeInTheDocument()
    })

    it('when no todos, then does not render any checkboxes', () => {
      // Arrange + Act
      renderWithProviders(
        <TodoList todos={[]} appId="app-1" onRefresh={vi.fn()} />,
      )

      // Assert
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    })
  })
})
