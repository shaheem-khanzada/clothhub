import type { Context } from 'hono';
import type { ZodError } from 'zod';

import { errorBody } from './errors.js';

type HookResult = { success: true } | { success: false; error: ZodError };

/**
 * Turns a failed request validation into the API's standard 400 body, with
 * one line per problem ("page: Too small: expected number to be >=1").
 */
export function validationHook(result: HookResult, c: Context) {
  if (result.success) return;

  const details = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return c.json(errorBody('invalid_request', 'The request is not valid', details), 400);
}
