import { create } from 'zustand';

/*
 * A stand-in for `lib/authClient` in tests (registered in jest.setup.ts).
 * Tests choose who is signed in with `signInAs()` / `signOutForTest()`, and
 * read or stub the sign-in calls through `authClientMock`.
 */

type TestUser = { id: string; name: string; email: string; image: string | null };

const useTestSession = create<{ user: TestUser | null }>()(() => ({ user: null }));

export function signInAs(user: Partial<TestUser> = {}) {
  useTestSession.setState({
    user: { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com', image: null, ...user },
  });
}

export function signOutForTest() {
  useTestSession.setState({ user: null });
}

const ok = <T>(data: T) => Promise.resolve({ data, error: null });

export const authClientMock = {
  useSession: () => {
    const user = useTestSession((state) => state.user);
    return { data: user ? { user, session: { id: 'session-1' } } : null, isPending: false, error: null };
  },
  getCookie: jest.fn(async () => ''),
  signIn: { email: jest.fn(() => ok({ user: {} })) },
  signUp: { email: jest.fn(() => ok({ user: {} })) },
  signOut: jest.fn(() => ok({ success: true })),
};
