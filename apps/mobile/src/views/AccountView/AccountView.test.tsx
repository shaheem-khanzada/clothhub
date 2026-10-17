import { act, fireEvent, render, screen } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { Alert } from 'react-native';

import { apiClient } from '@/axios';
import { authClient } from '@/lib/authClient';
import { signInAs, signOutForTest } from '@/test-utils/authClient';
import { createQueryWrapper } from '@/test-utils/queryClient';

import AccountView from './index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const api = new MockAdapter(apiClient);
const signOut = jest.mocked(authClient.signOut);
const alert = jest.spyOn(Alert, 'alert');

async function renderAccount() {
  await render(<AccountView />, { wrapper: createQueryWrapper() });
}

beforeEach(() => {
  api.reset();
  signOut.mockClear();
  mockPush.mockClear();
  alert.mockClear();
  signOutForTest();
});

describe('AccountView', () => {
  it('invites a signed-out person to sign in', async () => {
    await renderAccount();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Sign in or create account' }));
    });

    expect(mockPush).toHaveBeenCalledWith('/sign-in');
  });

  it('shows who is signed in', async () => {
    signInAs({ name: 'Ada Lovelace', email: 'ada@example.com' });
    await renderAccount();

    expect(screen.getByText('Ada Lovelace')).toBeOnTheScreen();
    expect(screen.getByText('ada@example.com')).toBeOnTheScreen();
    expect(screen.getByText('AL')).toBeOnTheScreen();
  });

  it('signs out', async () => {
    signInAs();
    await renderAccount();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    });

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('deletes the account only after the person confirms', async () => {
    signInAs();
    api.onDelete('/v1/me').reply(204);
    await renderAccount();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
    });

    expect(api.history.delete).toHaveLength(0);
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    const confirm = buttons.find((button) => button.style === 'destructive');

    await act(async () => {
      confirm?.onPress?.();
    });

    expect(api.history.delete).toHaveLength(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('says so when the account could not be deleted, and stays signed in', async () => {
    signInAs();
    api.onDelete('/v1/me').networkError();
    await renderAccount();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
    });
    await act(async () => {
      alert.mock.calls[0]?.[2]?.find((button) => button.style === 'destructive')?.onPress?.();
    });

    expect(alert).toHaveBeenLastCalledWith('We couldn’t delete your account. Check your connection and try again.');
    expect(signOut).not.toHaveBeenCalled();
  });
});
