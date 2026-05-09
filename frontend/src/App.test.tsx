import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'
import { renderWithProviders } from './test/renderWithProviders'

describe('App', () => {
  it('when rendered without authentication, then shows the login page', () => {
    renderWithProviders(<App />)
    expect(
      screen.getByRole('heading', { name: /log in/i }),
    ).toBeInTheDocument()
  })

  it('when rendered with authenticated user, then shows the app list page with Create App button', async () => {
    localStorage.setItem(
      'auth',
      JSON.stringify({ userId: 'user-1', email: 'test@example.com' }),
    )
    renderWithProviders(<App />)
    expect(
      await screen.findByRole('button', { name: /create app/i }),
    ).toBeInTheDocument()
  })
})
