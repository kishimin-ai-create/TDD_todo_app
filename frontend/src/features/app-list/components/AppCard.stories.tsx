import type { Meta, StoryObj } from '@storybook/react-vite'
import type { GetApiV1Apps200DataItem } from '../../../api/generated/models'

import { AppCard } from './AppCard'

type Story = StoryObj<typeof AppCard>

const mockApp: GetApiV1Apps200DataItem = {
  id: 'app-1',
  name: 'My App',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
}

const meta: Meta<typeof AppCard> = {
  title: 'Features/AppCard',
  component: AppCard,
  tags: ['autodocs'],
  argTypes: {
    app: {
      description: 'The app object to display',
    },
    onView: {
      description: 'Optional callback fired when View button is clicked',
    },
  },
}

export default meta

export const Default: Story = {
  args: {
    app: mockApp,
  },
}

export const WithCallback: Story = {
  args: {
    app: mockApp,
    onView: () => {},
  },
}

export const WithLongName: Story = {
  args: {
    app: {
      id: 'app-1',
      name: 'This is a very long application name that might wrap multiple lines in the display',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
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
  },
}

export const OldApp: Story = {
  args: {
    app: {
      id: 'app-old',
      name: 'Ancient App',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  },
}

export const WithCallbackAndLongName: Story = {
  args: {
    app: {
      id: 'app-1',
      name: 'Very Long Application Name For Testing Display And Wrapping Behavior In UI',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
    onView: () => {},
  },
}

export const MinimalName: Story = {
  args: {
    app: {
      id: 'app-minimal',
      name: 'A',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
  },
}
