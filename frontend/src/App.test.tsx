import { screen } from '@testing-library/react'
import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import App from './App'
import { isAuthenticatedAtom } from './shared/auth'
import { renderWithProviders } from './test/renderWithProviders'

describe('App', () => {
  it('when not authenticated, then shows login page', () => {
    // Arrange + Act
    renderWithProviders(<App />)

    // Assert
    expect(screen.getByRole('heading', { name: /ログイン/i })).toBeInTheDocument()
  })

  it('when authenticated, then shows the app list page with Create App button', async () => {
    // Arrange
    const store = createStore()
    store.set(isAuthenticatedAtom, true)

    // Act
    renderWithProviders(<App />, { store })

    // Assert
    expect(
      await screen.findByRole('button', { name: /create app/i }),
    ).toBeInTheDocument()
  })
})
