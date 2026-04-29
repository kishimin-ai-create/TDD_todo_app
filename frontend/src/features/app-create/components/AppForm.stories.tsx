import type { Meta, StoryObj } from '@storybook/react'
import { AppForm } from './AppForm'

type Story = StoryObj<typeof AppForm>

const meta: Meta<typeof AppForm> = {
  title: 'Features/AppForm',
  component: AppForm,
  tags: ['autodocs'],
  argTypes: {
    onSubmit: {
      description: 'Callback when form is submitted',
    },
    onCancel: {
      description: 'Callback when cancel button is clicked',
    },
    isLoading: {
      description: 'Shows loading state and disables submit button',
    },
    submitLabel: {
      description: 'Text for the submit button',
    },
    serverError: {
      description: 'Error message from server',
    },
    defaultValue: {
      description: 'Pre-filled value for the name field',
    },
  },
}

export default meta

export const Default: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Create',
  },
}

export const CreateMode: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Create',
  },
}

export const EditMode: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Update',
    defaultValue: 'Existing App Name',
  },
}

export const LoadingState: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: true,
    submitLabel: 'Create',
  },
}

export const WithServerError: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Create',
    serverError: 'App name already exists',
  },
}

export const WithConflictError: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Create',
    serverError: 'App name already exists (409 Conflict)',
  },
}

export const WithValidationError: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Create',
    serverError: 'Validation error: please check your input',
  },
}

export const WithGenericError: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Create',
    serverError: 'An error occurred. Please try again.',
  },
}

export const PreFilledForm: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Update',
    defaultValue: 'My App',
  },
}

export const LongPrefilledValue: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Update',
    defaultValue: 'This is a very long application name that tests how the input field handles extended text',
  },
}

export const WithUpdateLabel: Story = {
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    isLoading: false,
    submitLabel: 'Update',
  },
}
