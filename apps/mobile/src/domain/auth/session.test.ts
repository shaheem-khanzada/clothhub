import { renderHook } from '@testing-library/react-native';

import { useRequireAccount, useSession } from './session';

describe('session (before sign-in exists)', () => {
  it('treats everyone as signed out', async () => {
    const { result } = await renderHook(() => useSession());

    expect(result.current).toEqual({ status: 'signedOut', user: null });
  });

  it('runs account actions straight away and returns their result', async () => {
    const { result } = await renderHook(() => useRequireAccount());
    const action = jest.fn(() => 'saved');

    expect(result.current(action)).toBe('saved');
    expect(action).toHaveBeenCalledTimes(1);
  });
});
