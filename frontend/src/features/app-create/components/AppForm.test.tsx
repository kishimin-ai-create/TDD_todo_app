import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../test/renderWithProviders'
import { AppForm } from './AppForm'

describe('AppForm', () => {
  describe('Happy Path - Rendering', () => {
    it('when rendered, then shows App Name input field', () => {
      // Arrange + Act
      renderWithProviders(
        <AppForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      )

      // Assert
      expect(screen.getByLabelText(/app name/i)).toBeInTheDocument()
    })

    it('when rendered, then shows Cancel button', () => {
      // Arrange + Act
      renderWithProviders(
        <AppForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      )

      // Assert
      expect(
        screen.getByRole('button', { name: /cancel/i }),
      ).toBeInTheDocument()
    })

    it('when rendered, then shows submit button (Create or Update)', () => {
      // Arrange + Act
      renderWithProviders(
        <AppForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      )

      // Assert
      expect(
        screen.getByRole('button', { name: /create|update/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Validation Errors - Empty Name', () => {
    it('when submitted with empty name, then shows required validation error', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <AppForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /create|update/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when submitted with empty name, then onSubmit is NOT called', async () => {
      // Arrange
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      renderWithProviders(
        <AppForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /create|update/i }))

      // Assert
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Validation Errors - Name Too Long', () => {
    it('when submitted with name over 100 characters, then shows max length error', async () => {
      // Arrange
      const user = userEvent.setup()
      renderWithProviders(
        <AppForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      )

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'a'.repeat(101))
      await user.click(screen.getByRole('button', { name: /create|update/i }))

      // Assert
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })

    it('when submitted with name over 100 characters, then onSubmit is NOT called', async () => {
      // Arrange
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      renderWithProviders(
        <AppForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />,
      )

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'a'.repeat(101))
      await user.click(screen.getByRole('button', { name: /create|update/i }))

      // Assert
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Interaction - Cancel', () => {
    it('when Cancel button clicked, then calls onCancel once', async () => {
      // Arrange
      const user = userEvent.setup()
      const onCancel = vi.fn()
      renderWithProviders(
        <AppForm onSubmit={vi.fn()} onCancel={onCancel} isLoading={false} />,
      )

      // Act
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      // Assert
      expect(onCancel).toHaveBeenCalledOnce()
    })
  })

  describe('Loading State', () => {
    it('when isLoading is true, then submit button is disabled', () => {
      // Arrange + Act
      renderWithProviders(
        <AppForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={true} />,
      )

      // Assert — AppForm replaces the button label with "Loading..." when isLoading=true.
      // The submit button is still rendered and must be disabled.
      expect(
        screen.getByRole('button', { name: /loading/i }),
      ).toBeDisabled()
    })

    it('when isLoading is false, then submit button is enabled', () => {
      // Arrange + Act
      renderWithProviders(
        <AppForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />,
      )

      // Assert
      expect(
        screen.getByRole('button', { name: /create|update/i }),
      ).not.toBeDisabled()
    })
  })

  describe('Boundary Cases - Name Length', () => {
    it('when name has exactly 1 character (minimum), then onSubmit is called on submit', async () => {
      // Arrange
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      renderWithProviders(
        <AppForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />,
      )

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'A')
      await user.click(screen.getByRole('button', { name: /create|update/i }))

      // Assert
      expect(onSubmit).toHaveBeenCalledOnce()
    })

    it('when name has exactly 100 characters (maximum), then onSubmit is called on submit', async () => {
      // Arrange
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      renderWithProviders(
        <AppForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />,
      )

      // Act
      await user.type(screen.getByLabelText(/app name/i), 'a'.repeat(100))
      await user.click(screen.getByRole('button', { name: /create|update/i }))

      // Assert
      expect(onSubmit).toHaveBeenCalledOnce()
    })
  })

  describe('Pre-filled Form (Edit Mode)', () => {
    it('when defaultValue provided, then input is pre-filled', () => {
      // Arrange + Act
      renderWithProviders(
        <AppForm
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isLoading={false}
          defaultValue="Existing App"
        />,
      )

      // Assert
      expect(screen.getByLabelText(/app name/i)).toHaveValue('Existing App')
    })
  })
})
