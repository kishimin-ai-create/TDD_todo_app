import type { Meta, StoryObj } from '@storybook/react'
import { TodoList } from './TodoList'

type Story = StoryObj<typeof TodoList>

const mockTodo = {
  id: 'todo-1',
  title: 'Complete project documentation',
  completed: false,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  appId: 'app-1',
}

const mockCompletedTodo = {
  id: 'todo-2',
  title: 'Deploy to production',
  completed: true,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  appId: 'app-1',
}

const meta: Meta<typeof TodoList> = {
  title: 'Features/TodoList',
  component: TodoList,
  tags: ['autodocs'],
  argTypes: {
    todos: {
      description: 'Array of todo objects to display',
    },
    appId: {
      description: 'The ID of the app these todos belong to',
    },
    onRefresh: {
      description: 'Callback to refresh todos after mutations',
    },
  },
}

export default meta

export const Default: Story = {
  args: {
    todos: [mockTodo, mockCompletedTodo],
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const EmptyState: Story = {
  args: {
    todos: [],
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const SingleTodo: Story = {
  args: {
    todos: [mockTodo],
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const SingleCompletedTodo: Story = {
  args: {
    todos: [mockCompletedTodo],
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const AllCompleted: Story = {
  args: {
    todos: [
      { ...mockTodo, completed: true, id: 'todo-1' },
      { ...mockTodo, completed: true, id: 'todo-2', title: 'Second task' },
      { ...mockTodo, completed: true, id: 'todo-3', title: 'Third task' },
    ],
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const MixedStatuses: Story = {
  args: {
    todos: [
      { ...mockTodo, completed: false, id: 'todo-1', title: 'Pending task 1' },
      { ...mockTodo, completed: true, id: 'todo-2', title: 'Completed task 1' },
      { ...mockTodo, completed: false, id: 'todo-3', title: 'Pending task 2' },
      { ...mockTodo, completed: true, id: 'todo-4', title: 'Completed task 2' },
    ],
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const WithLongTitles: Story = {
  args: {
    todos: [
      {
        ...mockTodo,
        id: 'todo-1',
        title: 'This is a very long todo title that might wrap to multiple lines in the display',
      },
      {
        ...mockTodo,
        id: 'todo-2',
        completed: true,
        title: 'Another extremely long todo title with lots of descriptive text about what needs to be done',
      },
    ],
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const ManyTodos: Story = {
  args: {
    todos: Array.from({ length: 10 }, (_, i) => ({
      id: `todo-${i + 1}`,
      title: `Todo ${i + 1}`,
      completed: i % 2 === 0,
      createdAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      updatedAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      appId: 'app-1',
    })),
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const MinimalTitleLength: Story = {
  args: {
    todos: [
      { ...mockTodo, id: 'todo-1', title: 'A' },
      { ...mockTodo, id: 'todo-2', title: 'B' },
    ],
    appId: 'app-1',
    onRefresh: () => {},
  },
}
