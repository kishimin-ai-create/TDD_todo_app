import { screen } from '@testing-library/react'
import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import App from './App'
import { isAuthenticatedAtom } from './shared/auth'
import { renderWithProviders } from './test/renderWithProviders'

describe('App', () => {
  it('when not authenticated, then shows the landing page with Login and Sign Up buttons', async () => {
    renderWithProviders(<App />)
    expect(await screen.findByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('when authenticated, then shows the app list page with Create App button', async () => {
    const store = createStore()
    store.set(isAuthenticatedAtom, true)
    renderWithProviders(<App />, { store })
    expect(
      await screen.findByRole('button', { name: /create app/i }),
    ).toBeInTheDocument()
  })
})
