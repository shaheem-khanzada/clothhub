/*
 * The sign-in seam. V1 has no accounts: everyone is signed out, and actions
 * that will belong to an account (saving, collecting) run on the device.
 *
 * When sign-in arrives, `useSession` reads the real session and
 * `useRequireAccount` opens the sign-in sheet before running the action for
 * signed-out users. Screens already go through both, so they do not change.
 */

export type SessionUser = {
  id: string;
  name: string | null;
};

export type Session = { status: 'signedOut'; user: null } | { status: 'signedIn'; user: SessionUser };

const SIGNED_OUT: Session = { status: 'signedOut', user: null };

export function useSession(): Session {
  return SIGNED_OUT;
}

/**
 * Wraps an action that will need an account. Today it runs the action at
 * once and returns its result.
 */
export function useRequireAccount() {
  return function requireAccount<T>(action: () => T): T {
    return action();
  };
}
