import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createStore, Provider as JotaiProvider } from 'jotai'
import { http, HttpResponse } from 'msw'

import { AppEditPage } from './AppEditPage'

type Story = StoryObj<typeof AppEditPage>

const mockApp = {
  id: 'app-1',
  name: 'My App',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
}

const meta: Meta<typeof AppEditPage> = {
  title: 'Pages/AppEditPage',
  component: AppEditPage,
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
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            {
              success: true,
              data: {
                ...mockApp,
                name: 'Updated App',
                updatedAt: new Date().toISOString(),
              },
            },
            { status: 200 },
          ),
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
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }, { status: 200 }),
        ),
      ],
    },
  },
}

export const SubmittingState: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.put('/api/v1/apps/app-1', async () => {
          await new Promise(() => {}) // never resolves
          return HttpResponse.json({ success: true, data: mockApp }, { status: 200 })
        }),
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
              name: 'This is a very long application name that spans multiple lines for editing',
            },
          }),
        ),
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }, { status: 200 }),
        ),
      ],
    },
  },
}

export const ErrorConflict409: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: {
                code: 'CONFLICT',
                message: 'App already exists',
              },
            },
            { status: 409 },
          ),
        ),
      ],
    },
  },
}

export const ErrorValidation422: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'App name is required',
              },
            },
            { status: 422 },
          ),
        ),
      ],
    },
  },
}

export const ErrorServer500: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.put('/api/v1/apps/app-1', () =>
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

export const SuccessAfterRetry: Story = {
  args: {
    appId: 'app-1',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }),
        ),
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json(
            {
              success: true,
              data: {
                ...mockApp,
                name: 'Updated App Successfully',
                updatedAt: new Date().toISOString(),
              },
            },
            { status: 200 },
          ),
        ),
      ],
    },
  },
}

export const MinimalAppName: Story = {
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
              name: 'A',
            },
          }),
        ),
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }, { status: 200 }),
        ),
      ],
    },
  },
}

export const MaxLengthAppName: Story = {
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
              name: 'a'.repeat(100),
            },
          }),
        ),
        http.put('/api/v1/apps/app-1', () =>
          HttpResponse.json({ success: true, data: mockApp }, { status: 200 }),
        ),
      ],
    },
  },
}
