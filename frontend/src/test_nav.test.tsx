import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { SignupPage } from './features/auth/pages/SignupPage'
import { currentPageAtom } from './shared/navigation'
import { renderWithProviders } from './test/renderWithProviders'

describe('Navigation State Reset', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('when SignupPage is first rendered, email and password fields should be empty', () => {
    renderWithProviders(<SignupPage />)
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('')
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
  })

  it('when navigating from LoginPage to SignupPage, email and password fields should be empty', async () => {
    const user = userEvent.setup()
    const store = createStore()
    store.set(currentPageAtom, { name: 'login' })
    renderWithProviders(<App />, { store })

    // Type in login form
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'login@test.com')
    await user.type(screen.getByLabelText(/password/i), 'loginpass')
    
    // Navigate to signup
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    
    // Check signup fields are empty
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('')
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
  })
  
  it('when navigating from SignupPage to LoginPage, email and password fields should be empty', async () => {
    const user = userEvent.setup()
    const store = createStore()
    store.set(currentPageAtom, { name: 'signup' })
    renderWithProviders(<App />, { store })

    // Type in signup form
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'signup@test.com')
    await user.type(screen.getByLabelText(/password/i), 'signuppass')
    
    // Navigate to login
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    // Check login fields are empty
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('')
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
  })
  
  it('when navigating back from SignupPage -> LoginPage -> SignupPage, signup email and password fields should be empty', async () => {
    const user = userEvent.setup()
    const store = createStore()
    store.set(currentPageAtom, { name: 'signup' })
    renderWithProviders(<App />, { store })

    // Type in signup form
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'first@test.com')
    await user.type(screen.getByLabelText(/password/i), 'firstpass')
    
    // Navigate to login
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    // Navigate back to signup
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    
    // Check signup fields are empty (not the original values)
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('')
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
  })
})
