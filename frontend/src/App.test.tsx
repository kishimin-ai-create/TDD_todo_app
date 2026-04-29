import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'
import { renderWithProviders } from './test/renderWithProviders'

describe('App', () => {
  it('when rendered, then shows the app list page with Create App button', async () => {
    renderWithProviders(<App />)
    expect(
      await screen.findByRole('button', { name: /create app/i }),
    ).toBeInTheDocument()
  })
})
