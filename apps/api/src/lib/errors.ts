import type { ErrorResponse } from '@clothhub/shared';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * An error a route can throw on purpose. The app's error handler turns it
 * into the standard `{ error: { code, message } }` body.
 */
export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static notFound(what: string) {
    return new ApiError(404, 'not_found', `${what} not found`);
  }
}

export function errorBody(code: string, message: string, details?: unknown): ErrorResponse {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

export function sendError(c: Context, error: ApiError) {
  return c.json(errorBody(error.code, error.message, error.details), error.status);
}
