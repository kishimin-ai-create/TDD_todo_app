import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { AppList } from './AppList'

const mockApps = [
  {
    id: 'app-1',
    name: 'App One',
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 'app-2',
    name: 'App Two',
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-02T00:00:00Z',
  },
]

describe('AppList', () => {
  describe('Happy Path - Multiple Apps', () => {
    it('when apps provided, then renders each app card', () => {
      // Arrange + Act
      renderWithProviders(<AppList apps={mockApps} />)

      // Assert
      expect(screen.getByText('App One')).toBeInTheDocument()
      expect(screen.getByText('App Two')).toBeInTheDocument()
    })

    it('when apps provided, then renders correct number of View buttons', () => {
      // Arrange + Act
      renderWithProviders(<AppList apps={mockApps} />)

      // Assert
      expect(screen.getAllByRole('button', { name: /view/i })).toHaveLength(2)
    })
  })

  describe('Edge Case - Empty List', () => {
    it('when no apps, then shows empty state message', () => {
      // Arrange + Act
      renderWithProviders(<AppList apps={[]} />)

      // Assert
      expect(screen.getByText(/no apps/i)).toBeInTheDocument()
    })

    it('when no apps, then does not render any View buttons', () => {
      // Arrange + Act
      renderWithProviders(<AppList apps={[]} />)

      // Assert
      expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument()
    })
  })

  describe('Single App', () => {
    it('when one app provided, then renders exactly one app card', () => {
      // Arrange
      const singleApp = [mockApps[0]]

      // Act
      renderWithProviders(<AppList apps={singleApp} />)

      // Assert
      expect(screen.getByText('App One')).toBeInTheDocument()
      expect(screen.queryByText('App Two')).not.toBeInTheDocument()
    })
  })
})
