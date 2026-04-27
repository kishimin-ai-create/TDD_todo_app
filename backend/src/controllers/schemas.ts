import { z } from 'zod';

/**
 * AppDto Zod schema matching the shape returned by presentApp().
 */
export const AppDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * TodoDto Zod schema matching the shape returned by presentTodo().
 */
export const TodoDtoSchema = z.object({
  id: z.string(),
  appId: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Error body Zod schema for machine-readable error details.
 */
export const ErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
});

/**
 * Builds a success response envelope schema wrapping the given data schema.
 */
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    success: z.literal(true),
  });

/**
 * Error response envelope schema.
 */
export const ErrorResponseSchema = z.object({
  data: z.null(),
  success: z.literal(false),
  error: ErrorBodySchema,
});

/**
 * Create-app request body schema.
 */
export const CreateAppRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

/**
 * Update-app request body schema.
 */
export const UpdateAppRequestSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});

/**
 * Create-todo request body schema.
 */
export const CreateTodoRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

/**
 * Update-todo request body schema.
 */
export const UpdateTodoRequestSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});
