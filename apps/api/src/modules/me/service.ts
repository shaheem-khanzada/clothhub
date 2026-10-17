import { and, eq } from 'drizzle-orm';

import type { Database } from '../../db/client.js';
import { accounts, users } from '../../db/schema/auth.js';
import { ApiError } from '../../lib/errors.js';
import type { Logger } from '../../lib/logger.js';
import { type AppleSignIn, AppleRequestError } from '../auth/apple.js';

/** The signed-in person's own data. */
export class MeService {
  constructor(
    private readonly db: Database,
    /** Null when Sign in with Apple isn't configured. */
    private readonly apple: AppleSignIn | null = null,
    private readonly logger?: Logger,
  ) {}

  /**
   * Keeps Apple's refresh token for the person's Apple sign-in, so deleting
   * the account can revoke it. The code comes from the same native sign-in as
   * the identity token, and must belong to the Apple ID on this account.
   */
  async saveAppleAuthorization(userId: string, authorizationCode: string): Promise<void> {
    if (!this.apple) {
      throw ApiError.notFound('Sign in with Apple');
    }

    const account = await this.appleAccount(userId);

    if (!account) {
      throw ApiError.notFound('Apple sign-in for this account');
    }

    let exchanged: { subject: string; refreshToken: string };

    try {
      exchanged = await this.apple.exchangeCode(authorizationCode);
    } catch (error) {
      if (error instanceof AppleRequestError) {
        this.logger?.warn({ err: error, userId }, 'Apple refused the authorization code');
        throw new ApiError(400, 'apple_code_rejected', error.message);
      }
      throw error;
    }

    if (exchanged.subject !== account.accountId) {
      throw new ApiError(403, 'apple_account_mismatch', 'That code belongs to a different Apple ID');
    }

    await this.db
      .update(accounts)
      .set({ refreshToken: exchanged.refreshToken })
      .where(eq(accounts.id, account.id));
  }

  /**
   * Deletes the account. Sessions and sign-in methods go with it (ON DELETE
   * CASCADE), and so will everything keyed to the user as it is added
   * (favourites, collections). Signing in again starts a new, empty account.
   *
   * An Apple sign-in is revoked first, as Apple requires.
   */
  async deleteAccount(userId: string): Promise<void> {
    await this.revokeApple(userId);
    await this.db.delete(users).where(eq(users.id, userId));
  }

  /**
   * Best effort: if Apple can't be reached the account is still deleted, as
   * the person asked; the failure is logged.
   */
  private async revokeApple(userId: string) {
    if (!this.apple) {
      return;
    }

    const account = await this.appleAccount(userId);

    if (!account?.refreshToken) {
      return;
    }

    try {
      await this.apple.revoke(account.refreshToken);
    } catch (error) {
      this.logger?.warn({ err: error, userId }, 'Could not revoke Sign in with Apple');
    }
  }

  private async appleAccount(userId: string) {
    const [account] = await this.db
      .select({ id: accounts.id, accountId: accounts.accountId, refreshToken: accounts.refreshToken })
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'apple')))
      .limit(1);

    return account ?? null;
  }
}
