import type { ZodSchema } from 'zod';

export class IpcValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IpcValidationError';
  }
}

export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const messages = result.error.errors.map((issue) => issue.message).join('; ');
    throw new IpcValidationError(messages);
  }

  return result.data;
}

export function wrapIpcHandler<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof IpcValidationError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };
}
