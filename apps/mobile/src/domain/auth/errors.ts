/**
 * A sign-in failure, with Better Auth's error code (`INVALID_EMAIL_OR_PASSWORD`,
 * `USER_ALREADY_EXISTS`, …) or our own for failures that never reached it.
 */
export class AuthError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** What Better Auth's client returns from every call. */
type AuthResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code?: string; message?: string; status: number } };

/** The data of a successful call; an `AuthError` otherwise. */
export function unwrap<T>(result: AuthResult<T>): T {
  if (result.error) {
    const { code, message, status } = result.error;
    throw new AuthError(code ?? (status === 429 ? 'TOO_MANY_REQUESTS' : 'UNKNOWN'), message ?? 'Sign-in failed', status);
  }

  return result.data;
}

/** The translation key for an error, under `auth.errors`. */
export type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'invalidEmail'
  | 'passwordTooShort'
  | 'passwordTooLong'
  | 'tooManyAttempts'
  | 'network'
  | 'generic';

export function authErrorKey(error: unknown): AuthErrorKey {
  if (!(error instanceof AuthError)) {
    return 'generic';
  }

  switch (error.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'invalidCredentials';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'emailTaken';
    case 'INVALID_EMAIL':
      return 'invalidEmail';
    case 'PASSWORD_TOO_SHORT':
      return 'passwordTooShort';
    case 'PASSWORD_TOO_LONG':
      return 'passwordTooLong';
    case 'TOO_MANY_REQUESTS':
      return 'tooManyAttempts';
    default:
      // Better Auth reports an unreachable server as status 0.
      return error.status === 0 || error.status === null ? 'network' : 'generic';
  }
}
