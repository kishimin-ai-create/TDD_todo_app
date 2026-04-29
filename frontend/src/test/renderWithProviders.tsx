import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import { createStore, Provider as JotaiProvider } from 'jotai'
import type { ReactElement } from 'react'

/**
 * A Jotai store instance whose atom values can be inspected in tests.
 * Pass a custom store to renderWithProviders to spy on navigation state changes.
 */
export type TestStore = ReturnType<typeof createStore>

interface RenderWithProvidersOptions extends RenderOptions {
  initialPage?: { name: string; appId?: string }
  /** Optional Jotai store – pass `createStore()` to read atoms after interactions */
  store?: TestStore
}

/**
 * Renders a React element wrapped with:
 * - QueryClientProvider  (retry disabled so errors surface immediately)
 * - JotaiProvider        (isolated store per test by default)
 *
 * Returns all Testing Library utilities plus the `store` and `queryClient`
 * for post-render inspection of navigation/state atoms.
 */
export function renderWithProviders(
  ui: ReactElement,
  { store = createStore(), ...options }: RenderWithProvidersOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <JotaiProvider store={store}>{children}</JotaiProvider>
      </QueryClientProvider>
    )
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  }
}
