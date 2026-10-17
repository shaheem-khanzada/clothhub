import { decodeJwt, importPKCS8, SignJWT } from 'jose';

const APPLE = 'https://appleid.apple.com';

/** A client secret lasts an hour; a new one is made a minute before that. */
const SECRET_LIFETIME_SECONDS = 60 * 60;

export type AppleConfig = {
  teamId: string;
  keyId: string;
  /** The .p8 key's contents (PKCS #8, PEM). */
  privateKey: string;
  /** The iOS app's bundle id: the client id of a native Sign in with Apple. */
  bundleId: string;
};

export class AppleRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppleRequestError';
  }
}

/**
 * The parts of Sign in with Apple that need our key.
 *
 * Better Auth checks the identity token the app sends at sign-in, against
 * Apple's public keys; that needs no secret. This covers the rest: turning
 * the one-time authorization code from the same sign-in into a refresh token,
 * and revoking that token when the person deletes their account, which Apple
 * requires of apps that offer account deletion.
 */
export class AppleSignIn {
  private secret: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly config: AppleConfig,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  /** Apple's "client secret": a short-lived JWT signed with our key. */
  async clientSecret(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    if (this.secret && this.secret.expiresAt - 60 > now) {
      return this.secret.value;
    }

    const key = await importPKCS8(this.config.privateKey, 'ES256');
    const expiresAt = now + SECRET_LIFETIME_SECONDS;
    const value = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: this.config.keyId })
      .setIssuer(this.config.teamId)
      .setSubject(this.config.bundleId)
      .setAudience(APPLE)
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .sign(key);

    this.secret = { value, expiresAt };
    return value;
  }

  /**
   * Exchanges an authorization code from the app (valid five minutes, once)
   * for a refresh token. `subject` is the Apple user it belongs to: the
   * account id Better Auth stored at sign-in.
   */
  async exchangeCode(code: string): Promise<{ subject: string; refreshToken: string }> {
    const response = await this.post('/auth/token', { code, grant_type: 'authorization_code' });
    const body = (await response.json().catch(() => ({}))) as {
      refresh_token?: string;
      id_token?: string;
      error?: string;
    };

    if (!response.ok || !body.refresh_token || !body.id_token) {
      throw new AppleRequestError(`Apple refused the authorization code (${body.error ?? response.status})`);
    }

    // Straight from Apple over TLS in reply to our signed request, so its
    // claims can be read without checking the signature again.
    const { sub } = decodeJwt(body.id_token);

    if (!sub) {
      throw new AppleRequestError('Apple returned an identity token without a subject');
    }

    return { subject: sub, refreshToken: body.refresh_token };
  }

  /**
   * Asks Apple whether it accepts our credentials (bundle id, Team ID, Key ID
   * and key), by exchanging a code that can't be real: `invalid_grant` means
   * the credentials passed and only the code was refused; `invalid_client`
   * means Apple doesn't recognise them.
   */
  async checkCredentials(): Promise<'accepted' | 'rejected' | 'unreachable'> {
    try {
      const response = await this.post('/auth/token', {
        code: 'credentials-check',
        grant_type: 'authorization_code',
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      return body.error === 'invalid_client' ? 'rejected' : 'accepted';
    } catch {
      return 'unreachable';
    }
  }

  /** Revokes a refresh token: the app no longer has access to the person's Apple ID. */
  async revoke(refreshToken: string): Promise<void> {
    const response = await this.post('/auth/revoke', { token: refreshToken, token_type_hint: 'refresh_token' });

    if (!response.ok) {
      throw new AppleRequestError(`Apple refused to revoke the token (${response.status})`);
    }
  }

  private async post(path: string, fields: Record<string, string>) {
    return this.fetchFn(`${APPLE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.bundleId,
        client_secret: await this.clientSecret(),
        ...fields,
      }),
    });
  }
}
