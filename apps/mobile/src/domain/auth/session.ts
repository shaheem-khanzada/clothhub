import { router } from 'expo-router';
import { create } from 'zustand';

import { authClient } from '@/lib/authClient';

/*
 * The sign-in seam. Screens learn who is signed in from `useSession()`, and
 * every action that belongs to an account (saving, collecting) goes through
 * `useRequireAccount()`: signed in, it runs at once; signed out, the sign-in
 * sheet (`/sign-in`) opens first and the action runs once the person is in.
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
};

export type Session =
  /** The stored session is still being read (the first moments after launch). */
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: SessionUser };

const LOADING: Session = { status: 'loading', user: null };
const SIGNED_OUT: Session = { status: 'signedOut', user: null };

export function useSession(): Session {
  const { data, isPending } = authClient.useSession();

  if (data?.user) {
    const { id, name, email, image } = data.user;
    return { status: 'signedIn', user: { id, name, email, imageUrl: image ?? null } };
  }

  return isPending ? LOADING : SIGNED_OUT;
}

type AccountGate = {
  /** The action waiting for sign-in, if any. */
  pending: (() => void) | null;
  hold: (action: () => void) => void;
  /** Runs the waiting action (after a successful sign-in). */
  release: () => void;
  /** Forgets it (the person closed sign-in). */
  clear: () => void;
};

export const useAccountGate = create<AccountGate>()((set, get) => ({
  pending: null,
  hold: (action) => set({ pending: action }),
  release: () => {
    const { pending } = get();
    set({ pending: null });
    pending?.();
  },
  clear: () => set({ pending: null }),
}));

/**
 * Wraps an action that needs an account. Signed in, it runs straight away and
 * its result is returned; otherwise it waits for sign-in (and returns
 * undefined now).
 */
export function useRequireAccount() {
  const session = useSession();
  const hold = useAccountGate((state) => state.hold);

  return function requireAccount<T>(action: () => T): T | undefined {
    if (session.status === 'signedIn') {
      return action();
    }

    hold(() => {
      action();
    });
    router.push('/sign-in');
    return undefined;
  };
}
