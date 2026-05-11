import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LogoutButton } from './LogoutButton'

// Provide a factory so Vitest does not attempt to resolve the not-yet-existing module.
vi.mock('../hooks/useLogout', () => ({
  useLogout: vi.fn(),
}))

// Import after mock registration so the mocked version is used everywhere.
import { useLogout } from '../hooks/useLogout'

describe('LogoutButton', () => {
  const mockLogout = vi.fn()

  beforeEach(() => {
    vi.mocked(useLogout).mockReturnValue({ logout: mockLogout })
    mockLogout.mockClear()
  })

  describe('Rendering - Button Text', () => {
    it('when rendered, then displays a button with text "ログアウト"', () => {
      // Arrange + Act
      render(<LogoutButton />)

      // Assert
      expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })
  })

  describe('Rendering - Accessible Role', () => {
    it('when rendered, then the element has the button role', () => {
      // Arrange + Act
      render(<LogoutButton />)

      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Interaction - Click Calls Logout', () => {
    it('when the button is clicked once, then the logout function is called exactly once', () => {
      // Arrange
      render(<LogoutButton />)

      // Act
      fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

      // Assert
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('when the button is clicked twice, then the logout function is called twice', () => {
      // Arrange
      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: 'ログアウト' })

      // Act
      fireEvent.click(button)
      fireEvent.click(button)

      // Assert
      expect(mockLogout).toHaveBeenCalledTimes(2)
    })

    it('when the button is clicked, then the logout function is called with no arguments', () => {
      // Arrange
      render(<LogoutButton />)

      // Act
      fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

      // Assert
      expect(mockLogout).toHaveBeenCalledWith()
    })
  })
})
