import { z } from 'zod';

/**
 * Every error the API returns has this shape. `code` is machine-readable
 * snake_case (`not_found`, `invalid_request`, `internal_error`); `message` is
 * for logs and developers, not for showing to shoppers.
 */
export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  })
  .meta({ id: 'ErrorResponse' });

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
