import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { currentPageAtom } from '../../../shared/navigation'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  describe('Content - Page Title', () => {
    it('when rendered, then displays "Todo App TDD" as the main heading', () => {
      // Arrange + Act
      renderWithProviders(<LandingPage />)

      // Assert
      expect(
        screen.getByRole('heading', { level: 1, name: /todo app tdd/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Navigation - Login Button', () => {
    it('when rendered, then Login button is visible', () => {
      // Arrange + Act
      renderWithProviders(<LandingPage />)

      // Assert
      expect(
        screen.getByRole('button', { name: /login/i }),
      ).toBeInTheDocument()
    })

    it('when Login button is clicked, then currentPageAtom becomes { name: "login" }', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LandingPage />, { store })

      // Act
      await user.click(screen.getByRole('button', { name: /login/i }))

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'login' })
    })
  })

  describe('Navigation - Sign Up Button', () => {
    it('when rendered, then Sign Up button is visible', () => {
      // Arrange + Act
      renderWithProviders(<LandingPage />)

      // Assert
      expect(
        screen.getByRole('button', { name: /sign up/i }),
      ).toBeInTheDocument()
    })

    it('when Sign Up button is clicked, then currentPageAtom becomes { name: "signup" }', async () => {
      // Arrange
      const user = userEvent.setup()
      const store = createStore()
      renderWithProviders(<LandingPage />, { store })

      // Act
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'signup' })
    })
  })
})
