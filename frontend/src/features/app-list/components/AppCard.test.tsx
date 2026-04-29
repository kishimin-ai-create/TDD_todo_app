import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { AppCard } from './AppCard'

const mockApp = {
  id: 'app-1',
  name: 'My Test App',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
}

describe('AppCard', () => {
  describe('Happy Path - Rendering', () => {
    it('when rendered, then shows app name', () => {
      // Arrange + Act
      renderWithProviders(<AppCard app={mockApp} />)

      // Assert
      expect(screen.getByText('My Test App')).toBeInTheDocument()
    })

    it('when rendered, then shows created date', () => {
      // Arrange + Act
      renderWithProviders(<AppCard app={mockApp} />)

      // Assert
      expect(screen.getByText(/2026-04-01/)).toBeInTheDocument()
    })

    it('when rendered, then shows View button', () => {
      // Arrange + Act
      renderWithProviders(<AppCard app={mockApp} />)

      // Assert
      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument()
    })
  })

  describe('Interaction - Navigation', () => {
    it('when View button clicked, then onView callback is invoked', async () => {
      // Arrange
      const user = userEvent.setup()
      const onView = vi.fn()
      renderWithProviders(<AppCard app={mockApp} onView={onView} />)

      // Act
      await user.click(screen.getByRole('button', { name: /view/i }))

      // Assert
      expect(onView).toHaveBeenCalledOnce()
    })

    it('when View button clicked, then callback receives app id', async () => {
      // Arrange
      const user = userEvent.setup()
      const onView = vi.fn()
      renderWithProviders(<AppCard app={mockApp} onView={onView} />)

      // Act
      await user.click(screen.getByRole('button', { name: /view/i }))

      // Assert
      expect(onView).toHaveBeenCalledWith('app-1')
    })
  })
})
