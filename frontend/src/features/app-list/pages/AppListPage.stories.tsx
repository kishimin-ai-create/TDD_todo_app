import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createStore, Provider as JotaiProvider } from 'jotai'
import { AppListPage } from './AppListPage'

type Story = StoryObj<typeof AppListPage>

const meta: Meta<typeof AppListPage> = {
  title: 'Pages/AppListPage',
  component: AppListPage,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const store = createStore()

      return (
        <QueryClientProvider client={queryClient}>
          <JotaiProvider store={store}>
            <Story />
          </JotaiProvider>
        </QueryClientProvider>
      )
    },
  ],
}

export default meta

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps', () =>
          HttpResponse.json({
            success: true,
            data: [
              {
                id: 'app-1',
                name: 'My Todo App',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
              {
                id: 'app-2',
                name: 'Project Management',
                createdAt: '2026-04-02T00:00:00Z',
                updatedAt: '2026-04-02T00:00:00Z',
              },
            ],
          }),
        ),
      ],
    },
  },
}

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps', async () => {
          await new Promise(() => {}) // never resolves
          return HttpResponse.json({ success: true, data: [] })
        }),
      ],
    },
  },
}

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps', () =>
          HttpResponse.json({
            success: true,
            data: [],
          }),
        ),
      ],
    },
  },
}

export const WithManyApps: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps', () =>
          HttpResponse.json({
            success: true,
            data: Array.from({ length: 10 }, (_, i) => ({
              id: `app-${i + 1}`,
              name: `App ${i + 1}`,
              createdAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
              updatedAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
            })),
          }),
        ),
      ],
    },
  },
}

export const WithLongAppNames: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps', () =>
          HttpResponse.json({
            success: true,
            data: [
              {
                id: 'app-1',
                name: 'This is a very long application name that might wrap to multiple lines in the UI component',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            ],
          }),
        ),
      ],
    },
  },
}

export const ErrorState500: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: {
                code: 'SERVER_ERROR',
                message: 'Internal server error',
              },
            },
            { status: 500 },
          ),
        ),
      ],
    },
  },
}

export const ErrorStateNetworkError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps', () => HttpResponse.error()),
      ],
    },
  },
}

export const SingleApp: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps', () =>
          HttpResponse.json({
            success: true,
            data: [
              {
                id: 'app-1',
                name: 'Single App',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            ],
          }),
        ),
      ],
    },
  },
}
