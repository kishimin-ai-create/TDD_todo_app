import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createStore, Provider as JotaiProvider } from 'jotai'
import { http, HttpResponse } from 'msw'

import { AppDetailPage } from './AppDetailPage'

type Story = StoryObj<typeof AppDetailPage>

const mockApp = {
  id: 'app-1',
  name: 'My App',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
}

const mockTodos = [
  {
    id: 'todo-1',
    title: 'Complete project documentation',
    completed: false,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    appId: 'app-1',
  },
  {
    id: 'todo-2',
    title: 'Deploy to production',
    completed: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    appId: 'app-1',
  },
]

const meta: Meta<typeof AppDetailPage> = {
  title: 'Pages/AppDetailPage',
  component: AppDetailPage,
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
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.get('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json({ success: true, data: mockTodos }),
        ),
      ],
    },
  },
}

export const LoadingState: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', async () => {
          await new Promise(() => {}) // never resolves
          return HttpResponse.json({ success: true, data: mockApp })
        }),
        http.get('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json({ success: true, data: [] }),
        ),
      ],
    },
  },
}

export const EmptyTodoList: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.get('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json({ success: true, data: [] }),
        ),
      ],
    },
  },
}

export const WithManyTodos: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.get('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json({
            success: true,
            data: Array.from({ length: 15 }, (_, i) => ({
              id: `todo-${i + 1}`,
              title: `Todo ${i + 1}`,
              completed: i % 3 === 0,
              createdAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
              updatedAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
              appId: 'app-1',
            })),
          }),
        ),
      ],
    },
  },
}

export const WithLongAppName: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({
            success: true,
            data: {
              ...mockApp,
              name: 'This is a very long application name that spans multiple lines in the header',
            },
          }),
        ),
        http.get('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json({ success: true, data: mockTodos }),
        ),
      ],
    },
  },
}

export const WithLongTodoTitles: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.get('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json({
            success: true,
            data: [
              {
                id: 'todo-1',
                title: 'This is a very long todo title that spans multiple lines and tests text wrapping behavior',
                completed: false,
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
                appId: 'app-1',
              },
              {
                id: 'todo-2',
                title: 'Another extremely long todo title with lots of descriptive text about what needs to be accomplished',
                completed: true,
                createdAt: '2026-04-02T00:00:00Z',
                updatedAt: '2026-04-02T00:00:00Z',
                appId: 'app-1',
              },
            ],
          }),
        ),
      ],
    },
  },
}

export const AllCompletedTodos: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.get('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json({
            success: true,
            data: [
              { ...mockTodos[0], completed: true },
              { ...mockTodos[1], completed: true },
            ],
          }),
        ),
      ],
    },
  },
}

export const AllPendingTodos: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.get('/api/v1/apps/app-1/todos', () =>
          HttpResponse.json({
            success: true,
            data: [
              { ...mockTodos[0], completed: false },
              { ...mockTodos[1], completed: false },
            ],
          }),
        ),
      ],
    },
  },
}

export const AppNotFound: Story = {
  args: {
    appId: 'nonexistent-app',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/nonexistent-app', () =>
          HttpResponse.json({
            success: false,
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'App not found',
            },
          }),
        ),
        http.get('/api/v1/apps/nonexistent-app/todos', () =>
          HttpResponse.json({
            success: false,
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'App not found',
            },
          }),
        ),
      ],
    },
  },
}

export const ServerError: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
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
