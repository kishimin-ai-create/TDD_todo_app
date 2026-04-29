import type { Meta, StoryObj } from '@storybook/react-vite'

import { TodoForm } from './TodoForm'

type Story = StoryObj<typeof TodoForm>

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

const meta: Meta<typeof TodoForm> = {
  title: 'Features/TodoForm',
  component: TodoForm,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      description: 'Form mode: "create" or "edit"',
      control: { type: 'select', options: ['create', 'edit'] },
    },
    todo: {
      description: 'Required in edit mode, the todo object being edited',
    },
    appId: {
      description: 'The ID of the app this todo belongs to',
    },
    onCancel: {
      description: 'Callback when Cancel button is clicked',
    },
    onSuccess: {
      description: 'Callback after successful submission',
    },
  },
}

export default meta

export const CreateMode: Story = {
  args: {
    mode: 'create',
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}

export const EditMode: Story = {
  args: {
    mode: 'edit',
    todo: mockTodo,
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}

export const EditModeCompleted: Story = {
  args: {
    mode: 'edit',
    todo: mockCompletedTodo,
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}

export const EditModeWithLongTitle: Story = {
  args: {
    mode: 'edit',
    todo: {
      ...mockTodo,
      title: 'This is a very long todo title that tests how the input field handles extended text for editing',
    },
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}

export const EditModeMinimalTitle: Story = {
  args: {
    mode: 'edit',
    todo: {
      ...mockTodo,
      title: 'A',
    },
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}

export const EditModeMaxLengthTitle: Story = {
  args: {
    mode: 'edit',
    todo: {
      ...mockTodo,
      title: 'a'.repeat(200),
    },
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}

export const CreateModeEmpty: Story = {
  args: {
    mode: 'create',
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}

export const EditModeReadOnlyStatus: Story = {
  args: {
    mode: 'edit',
    todo: mockTodo,
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}

export const EditModeCompletedReadOnlyStatus: Story = {
  args: {
    mode: 'edit',
    todo: mockCompletedTodo,
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}

export const CreateModeWithCompletedCheckbox: Story = {
  args: {
    mode: 'create',
    appId: 'app-1',
    onCancel: () => {},
    onSuccess: () => {},
  },
}
