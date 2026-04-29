import type { Meta, StoryObj } from '@storybook/react-vite'

import { AppHeader } from './AppHeader'

type Story = StoryObj<typeof AppHeader>

const mockApp = {
  id: 'app-1',
  name: 'My App',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
}

const meta: Meta<typeof AppHeader> = {
  title: 'Features/AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  argTypes: {
    app: {
      description: 'The app object containing id, name, and dates',
    },
    onEdit: {
      description: 'Callback when Edit button is clicked',
    },
    onDelete: {
      description: 'Callback when Delete button is clicked',
    },
    onBack: {
      description: 'Optional callback when Back button is clicked',
    },
  },
}

export default meta

export const Default: Story = {
  args: {
    app: mockApp,
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const WithoutBackButton: Story = {
  args: {
    app: mockApp,
    onEdit: () => {},
    onDelete: () => {},
  },
}

export const WithLongAppName: Story = {
  args: {
    app: {
      id: 'app-1',
      name: 'This is a very long application name that might wrap to multiple lines in the header component',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const RecentlyCreated: Story = {
  args: {
    app: {
      id: 'app-new',
      name: 'Brand New App',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const OldApp: Story = {
  args: {
    app: {
      id: 'app-old',
      name: 'Ancient App',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const MinimalAppName: Story = {
  args: {
    app: {
      id: 'app-1',
      name: 'A',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}

export const WithCallbacksAndLongName: Story = {
  args: {
    app: {
      id: 'app-complex',
      name: 'Complex Application Name With Very Long Description For UI Testing Purposes',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
    onEdit: () => {},
    onDelete: () => {},
    onBack: () => {},
  },
}
