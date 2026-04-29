import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { AppHeader } from './AppHeader'

const mockApp = {
  id: 'app-1',
  name: 'My App',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
}

describe('AppHeader', () => {
  describe('Happy Path - Rendering', () => {
    it('when rendered, then shows app name', () => {
      // Arrange + Act
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={vi.fn()} onDelete={vi.fn()} />,
      )

      // Assert
      expect(screen.getByText('My App')).toBeInTheDocument()
    })

    it('when rendered, then shows createdAt timestamp', () => {
      // Arrange + Act
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={vi.fn()} onDelete={vi.fn()} />,
      )

      // Assert – date portion of ISO string should appear somewhere in the header
      expect(screen.getByText(/2026-04-01/)).toBeInTheDocument()
    })

    it('when rendered, then shows Edit button', () => {
      // Arrange + Act
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={vi.fn()} onDelete={vi.fn()} />,
      )

      // Assert
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    })

    it('when rendered, then shows Delete button', () => {
      // Arrange + Act
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={vi.fn()} onDelete={vi.fn()} />,
      )

      // Assert
      expect(
        screen.getByRole('button', { name: /delete/i }),
      ).toBeInTheDocument()
    })

    it('when rendered, then shows Back button', () => {
      // Arrange + Act
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={vi.fn()} onDelete={vi.fn()} />,
      )

      // Assert
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })
  })

  describe('Interaction - Back callback', () => {
    it('when Back button clicked, then calls onBack once', async () => {
      // Arrange
      const user = userEvent.setup()
      const onBack = vi.fn()
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={vi.fn()} onDelete={vi.fn()} onBack={onBack} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /back/i }))

      // Assert
      expect(onBack).toHaveBeenCalledOnce()
    })
  })

  describe('Interaction - Edit callback', () => {
    it('when Edit button clicked, then calls onEdit once', async () => {
      // Arrange
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={onEdit} onDelete={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /edit/i }))

      // Assert
      expect(onEdit).toHaveBeenCalledOnce()
    })

    it('when Edit button clicked, then does NOT call onDelete', async () => {
      // Arrange
      const user = userEvent.setup()
      const onDelete = vi.fn()
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={vi.fn()} onDelete={onDelete} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /edit/i }))

      // Assert
      expect(onDelete).not.toHaveBeenCalled()
    })
  })

  describe('Interaction - Delete callback', () => {
    it('when Delete button clicked, then calls onDelete once', async () => {
      // Arrange
      const user = userEvent.setup()
      const onDelete = vi.fn()
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={vi.fn()} onDelete={onDelete} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))

      // Assert
      expect(onDelete).toHaveBeenCalledOnce()
    })

    it('when Delete button clicked, then does NOT call onEdit', async () => {
      // Arrange
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderWithProviders(
        <AppHeader app={mockApp} onEdit={onEdit} onDelete={vi.fn()} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /delete/i }))

      // Assert
      expect(onEdit).not.toHaveBeenCalled()
    })
  })
})
