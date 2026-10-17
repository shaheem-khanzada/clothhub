import { z } from 'zod';

/** The signed-in user, as the app shows them (account screen, avatars). */
export const AccountSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    /** Profile photo from Apple/Google sign-in, when there is one. */
    imageUrl: z.url().nullable().default(null),
  })
  .meta({ id: 'Account' });

export type AccountResponse = z.infer<typeof AccountSchema>;

export const MeResponseSchema = z
  .object({
    account: AccountSchema,
  })
  .meta({ id: 'Me' });

export type MeResponse = z.infer<typeof MeResponseSchema>;

/**
 * Sent by the app straight after a Sign in with Apple: the one-time code from
 * that sign-in, which lets the API revoke the app's access to the person's
 * Apple ID if they delete their account.
 */
export const AppleAuthorizationRequestSchema = z
  .object({
    authorizationCode: z.string().min(1).max(2048),
  })
  .meta({ id: 'AppleAuthorizationRequest' });

export type AppleAuthorizationRequest = z.infer<typeof AppleAuthorizationRequestSchema>;
