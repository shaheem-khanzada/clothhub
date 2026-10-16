import { eq } from 'drizzle-orm';

import type { Database } from '../../db/client.js';
import { users } from '../../db/schema/auth.js';

/** The signed-in person's own data. */
export class MeService {
  constructor(private readonly db: Database) {}

  /**
   * Deletes the account. Sessions and sign-in methods go with it (ON DELETE
   * CASCADE), and so will everything keyed to the user as it is added
   * (favourites, collections). Signing in again starts a new, empty account.
   */
  async deleteAccount(userId: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, userId));
  }
}
