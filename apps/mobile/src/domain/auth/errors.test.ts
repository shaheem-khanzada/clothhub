import { AuthError, authErrorKey, unwrap } from './errors';

describe('unwrap', () => {
  it('returns the data of a successful call', () => {
    expect(unwrap({ data: { ok: true }, error: null })).toEqual({ ok: true });
  });

  it("throws Better Auth's error code", () => {
    expect(() =>
      unwrap({ data: null, error: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password', status: 401 } }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_EMAIL_OR_PASSWORD', status: 401 }));
  });

  it('names rate limiting, which arrives without a code', () => {
    expect(() => unwrap({ data: null, error: { status: 429 } })).toThrow(
      expect.objectContaining({ code: 'TOO_MANY_REQUESTS' }),
    );
  });
});

describe('authErrorKey', () => {
  it.each([
    ['INVALID_EMAIL_OR_PASSWORD', 401, 'invalidCredentials'],
    ['USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', 422, 'emailTaken'],
    ['OAUTH_LINK_ERROR', 401, 'signInWithEmailInstead'],
    ['PASSWORD_TOO_SHORT', 400, 'passwordTooShort'],
    ['TOO_MANY_REQUESTS', 429, 'tooManyAttempts'],
    ['UNKNOWN', 0, 'network'],
    ['SOMETHING_NEW', 500, 'generic'],
  ])('maps %s (%i) to %s', (code, status, key) => {
    expect(authErrorKey(new AuthError(code, 'x', status))).toBe(key);
  });

  it('treats anything else as a generic failure', () => {
    expect(authErrorKey(new Error('boom'))).toBe('generic');
  });
});
