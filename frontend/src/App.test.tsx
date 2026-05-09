import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import App from './App'
import { isLoggedInAtom } from './shared/auth'
import { renderWithProviders } from './test/renderWithProviders'
import { server } from './test/server'

describe('App', () => {
  it('when rendered without login, then shows the login page', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
  })

  it('when logged in, then shows the app list page with Create App button', async () => {
    const store = createStore()
    store.set(isLoggedInAtom, true)
    renderWithProviders(<App />, { store })
    expect(
      await screen.findByRole('button', { name: /create app/i }),
    ).toBeInTheDocument()
  })

  it('when login form is submitted with valid credentials, then shows the app list page', async () => {
    server.use(
      http.get('/api/v1/apps', () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    )
    const user = userEvent.setup()
    renderWithProviders(<App />)

    await user.type(screen.getByLabelText(/username/i), 'admin')
    await user.type(screen.getByLabelText(/password/i), 'password')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(
      await screen.findByRole('button', { name: /create app/i }),
    ).toBeInTheDocument()
  })
})
