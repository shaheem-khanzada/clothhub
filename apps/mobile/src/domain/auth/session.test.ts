import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';

import { signInAs, signOutForTest } from '@/test-utils/authClient';

import { useAccountGate, useRequireAccount, useSession } from './session';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(() => {
  signOutForTest();
  useAccountGate.getState().clear();
  jest.mocked(router.push).mockClear();
});

describe('useSession', () => {
  it('is signed out without a session', async () => {
    const { result } = await renderHook(() => useSession());

    expect(result.current).toEqual({ status: 'signedOut', user: null });
  });

  it('describes the signed-in person', async () => {
    signInAs({ id: 'user-7', name: 'Grace Hopper', email: 'grace@example.com', image: 'https://example.com/g.jpg' });
    const { result } = await renderHook(() => useSession());

    expect(result.current).toEqual({
      status: 'signedIn',
      user: { id: 'user-7', name: 'Grace Hopper', email: 'grace@example.com', imageUrl: 'https://example.com/g.jpg' },
    });
  });
});

describe('useRequireAccount', () => {
  it('runs the action straight away when signed in', async () => {
    signInAs();
    const { result } = await renderHook(() => useRequireAccount());
    const action = jest.fn(() => 'saved');

    expect(result.current(action)).toBe('saved');
    expect(action).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('opens the sign-in sheet first when signed out, and runs the action once signed in', async () => {
    const { result } = await renderHook(() => useRequireAccount());
    const action = jest.fn();

    expect(result.current(action)).toBeUndefined();
    expect(action).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/sign-in');

    await act(async () => {
      useAccountGate.getState().release();
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(useAccountGate.getState().pending).toBeNull();
  });

  it('drops the action if sign-in is abandoned', async () => {
    const { result } = await renderHook(() => useRequireAccount());
    const action = jest.fn();

    result.current(action);
    useAccountGate.getState().clear();
    useAccountGate.getState().release();

    expect(action).not.toHaveBeenCalled();
  });
});
