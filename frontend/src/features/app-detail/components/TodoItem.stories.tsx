import type { Meta, StoryObj } from '@storybook/react-vite'

import { TodoItem } from './TodoItem'

type Story = StoryObj<typeof TodoItem>

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

const meta: Meta<typeof TodoItem> = {
  title: 'Features/TodoItem',
  component: TodoItem,
  tags: ['autodocs'],
  argTypes: {
    todo: {
      description: 'The todo object to display',
    },
    appId: {
      description: 'The ID of the app this todo belongs to',
    },
    onRefresh: {
      description: 'Callback to refresh todos after mutations',
    },
  },
}

export default meta

export const Default: Story = {
  args: {
    todo: mockTodo,
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const Completed: Story = {
  args: {
    todo: mockCompletedTodo,
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const Pending: Story = {
  args: {
    todo: mockTodo,
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const WithLongTitle: Story = {
  args: {
    todo: {
      ...mockTodo,
      title: 'This is a very long todo title that spans multiple lines and tests text wrapping in the component display',
    },
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const CompletedWithLongTitle: Story = {
  args: {
    todo: {
      ...mockCompletedTodo,
      title: 'Another extremely long completed todo title with lots of descriptive text showing strike-through styling',
    },
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const MinimalTitle: Story = {
  args: {
    todo: {
      ...mockTodo,
      title: 'A',
    },
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const MaxLengthTitle: Story = {
  args: {
    todo: {
      ...mockTodo,
      title: 'a'.repeat(200),
    },
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const RecentTodo: Story = {
  args: {
    todo: {
      ...mockTodo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    appId: 'app-1',
    onRefresh: () => {},
  },
}

export const OldTodo: Story = {
  args: {
    todo: {
      ...mockTodo,
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    appId: 'app-1',
    onRefresh: () => {},
  },
}
