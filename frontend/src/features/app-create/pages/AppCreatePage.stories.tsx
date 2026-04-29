import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createStore, Provider as JotaiProvider } from 'jotai'
import { AppCreatePage } from './AppCreatePage'

type Story = StoryObj<typeof AppCreatePage>

const meta: Meta<typeof AppCreatePage> = {
  title: 'Pages/AppCreatePage',
  component: AppCreatePage,
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
        http.post('/api/v1/apps', () =>
          HttpResponse.json(
            {
              success: true,
              data: {
                id: 'new-app',
                name: 'New App',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            },
            { status: 201 },
          ),
        ),
      ],
    },
  },
}

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/v1/apps', async () => {
          await new Promise(() => {}) // never resolves
          return HttpResponse.json({}, { status: 201 })
        }),
      ],
    },
  },
}

export const ErrorConflict409: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/v1/apps', () =>
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
  parameters: {
    msw: {
      handlers: [
        http.post('/api/v1/apps', () =>
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
  parameters: {
    msw: {
      handlers: [
        http.post('/api/v1/apps', () =>
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
  parameters: {
    msw: {
      handlers: [
        http.post('/api/v1/apps', () =>
          HttpResponse.json(
            {
              success: true,
              data: {
                id: 'retry-app',
                name: 'Retry App',
                createdAt: '2026-04-01T00:00:00Z',
                updatedAt: '2026-04-01T00:00:00Z',
              },
            },
            { status: 201 },
          ),
        ),
      ],
    },
  },
}
