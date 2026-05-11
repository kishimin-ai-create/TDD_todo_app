import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { authAtom } from './shared/auth'
import { currentPageAtom } from './shared/navigation'
import { renderWithProviders } from './test/renderWithProviders'
import { server } from './test/server'

describe('App', () => {
  beforeEach(() => {
    // atomWithStorage syncs to localStorage; clear between tests to avoid cross-contamination
    localStorage.clear()
  })

  describe('Unauthenticated - Default Route', () => {
    it('when unauthenticated, then LandingPage is displayed with "Todo App TDD" heading', () => {
      // Arrange
      const store = createStore()
      // authAtom defaults to null (localStorage is cleared above)

      // Act
      renderWithProviders(<App />, { store })

      // Assert
      expect(
        screen.getByRole('heading', { level: 1, name: /todo app tdd/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Unauthenticated - Login Route', () => {
    it('when unauthenticated and currentPage is "login", then LoginPage is displayed', () => {
      // Arrange
      const store = createStore()
      store.set(currentPageAtom, { name: 'login' })

      // Act
      renderWithProviders(<App />, { store })

      // Assert — LoginPage has an email input and a Login button
      expect(
        screen.getByRole('textbox', { name: /email/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Unauthenticated - Signup Route', () => {
    it('when unauthenticated and currentPage is "signup", then SignupPage is displayed', () => {
      // Arrange
      const store = createStore()
      store.set(currentPageAtom, { name: 'signup' })

      // Act
      renderWithProviders(<App />, { store })

      // Assert — SignupPage has an email input and a Sign Up button
      expect(
        screen.getByRole('button', { name: /sign up/i }),
      ).toBeInTheDocument()
    })

    it('when switched between Signup and Login pages, then form fields remain independent', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      store.set(currentPageAtom, { name: 'signup' })

      // Act: Render SignupPage
      renderWithProviders(<App />, { store })
      
      // Fill in SignupPage form
      const signupEmailInput = screen.getByRole('textbox', { name: /email/i })
      const signupPasswordInput = screen.getByLabelText(/password/i)
      
      await user.type(signupEmailInput, 'signup@example.com')
      await user.type(signupPasswordInput, 'signuppassword123')
      
      expect(signupEmailInput).toHaveValue('signup@example.com')
      expect(signupPasswordInput).toHaveValue('signuppassword123')
      
      // Switch to LoginPage
      store.set(currentPageAtom, { name: 'login' })
      
      // Wait for React to re-render and update DOM
      await waitFor(() => {
        const loginEmailInput = screen.getByRole('textbox', { name: /email/i })
        const loginPasswordInput = screen.getByLabelText(/password/i)
        expect(loginEmailInput).toHaveValue('')
        expect(loginPasswordInput).toHaveValue('')
      })
      
      // Fill in LoginPage form
      const loginEmailInput = screen.getByRole('textbox', { name: /email/i })
      const loginPasswordInput = screen.getByLabelText(/password/i)
      
      await user.type(loginEmailInput, 'login@example.com')
      await user.type(loginPasswordInput, 'loginpassword123')
      
      expect(loginEmailInput).toHaveValue('login@example.com')
      expect(loginPasswordInput).toHaveValue('loginpassword123')
      
      // Switch back to SignupPage
      store.set(currentPageAtom, { name: 'signup' })
      
      // Wait for React to re-render and update DOM
      await waitFor(() => {
        const backToSignupEmailInput = screen.getByRole('textbox', { name: /email/i })
        const backToSignupPasswordInput = screen.getByLabelText(/password/i)
        expect(backToSignupEmailInput).toHaveValue('')
        expect(backToSignupPasswordInput).toHaveValue('')
      })
    })
  })

  describe('Authenticated - App List Route', () => {
    it('when authenticated, then AppListPage is displayed with Create App button', async () => {
      // Arrange
      server.use(
        http.get('/api/v1/apps', () =>
          HttpResponse.json({ success: true, data: [] }),
        ),
      )
      const store = createStore()
      store.set(authAtom, {
        token: 'test-token',
        user: { id: 'user-1', email: 'test@example.com' },
      })

      // Act
      renderWithProviders(<App />, { store, initialPage: { name: 'app-list' } })

      // Assert
      expect(
        await screen.findByRole('button', { name: /create app/i }),
      ).toBeInTheDocument()
    })
  })
})
