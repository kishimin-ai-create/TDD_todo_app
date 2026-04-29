import type { Meta, StoryObj } from '@storybook/react'
import type { GetApiV1Apps200DataItem } from '../../../api/generated/models'
import { AppList } from './AppList'

type Story = StoryObj<typeof AppList>

const mockApp: GetApiV1Apps200DataItem = {
  id: 'app-1',
  name: 'Sample App',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
}

const meta: Meta<typeof AppList> = {
  title: 'Features/AppList',
  component: AppList,
  tags: ['autodocs'],
  argTypes: {
    apps: {
      description: 'Array of app objects to display',
    },
  },
}

export default meta

export const Default: Story = {
  args: {
    apps: [
      {
        id: 'app-1',
        name: 'My Todo App',
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      },
      {
        id: 'app-2',
        name: 'Project Tracker',
        createdAt: '2026-04-02T00:00:00Z',
        updatedAt: '2026-04-02T00:00:00Z',
      },
      {
        id: 'app-3',
        name: 'Shopping List',
        createdAt: '2026-04-03T00:00:00Z',
        updatedAt: '2026-04-03T00:00:00Z',
      },
    ],
  },
}

export const EmptyState: Story = {
  args: {
    apps: [],
  },
}

export const SingleApp: Story = {
  args: {
    apps: [mockApp],
  },
}

export const WithLongNames: Story = {
  args: {
    apps: [
      {
        id: 'app-1',
        name: 'This is a very long application name that spans multiple lines and tests text wrapping',
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      },
      {
        id: 'app-2',
        name: 'Another extremely long application name with lots of descriptive text',
        createdAt: '2026-04-02T00:00:00Z',
        updatedAt: '2026-04-02T00:00:00Z',
      },
    ],
  },
}

export const ManyApps: Story = {
  args: {
    apps: Array.from({ length: 8 }, (_, i) => ({
      id: `app-${i + 1}`,
      name: `App ${i + 1}`,
      createdAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      updatedAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    })),
  },
}
