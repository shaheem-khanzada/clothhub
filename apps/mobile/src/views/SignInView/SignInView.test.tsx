import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { useAccountGate } from '@/domain/auth/session';
import { authClient } from '@/lib/authClient';
import { createQueryWrapper } from '@/test-utils/queryClient';

import SignInView from './index';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  router: { push: jest.fn() },
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const signInEmail = jest.mocked(authClient.signIn.email);
const signUpEmail = jest.mocked(authClient.signUp.email);

async function renderSignIn() {
  await render(<SignInView />, { wrapper: createQueryWrapper() });
}

async function fill(label: string, value: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText(label), value);
  });
}

async function press(name: string) {
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name }));
  });
}

beforeEach(() => {
  mockBack.mockClear();
  signInEmail.mockClear();
  signUpEmail.mockClear();
  useAccountGate.getState().clear();
});

describe('SignInView', () => {
  it('signs in with email and password, runs the waiting action and closes', async () => {
    const waiting = jest.fn();
    useAccountGate.getState().hold(waiting);
    await renderSignIn();

    await fill('Email', ' ada@example.com ');
    await fill('Password', 'analytical');
    await press('Sign in');

    expect(signInEmail).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'analytical' });
    expect(waiting).toHaveBeenCalledTimes(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('points out what to fix before sending anything', async () => {
    await renderSignIn();

    await fill('Email', 'ada@');
    await press('Sign in');

    expect(screen.getByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it('explains a wrong password and stays open', async () => {
    signInEmail.mockResolvedValueOnce({
      data: null,
      error: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password', status: 401 },
    } as never);
    await renderSignIn();

    await fill('Email', 'ada@example.com');
    await fill('Password', 'wrong-one');
    await press('Sign in');

    expect(screen.getByText('That email and password don’t match.')).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('creates an account with a name', async () => {
    await renderSignIn();

    await press('Create an account');
    expect(screen.getByText('Create your account')).toBeOnTheScreen();

    await fill('Name', 'Ada Lovelace');
    await fill('Email', 'ada@example.com');
    await fill('Password', 'short');
    await press('Create account');

    expect(screen.getByText('Use at least 8 characters.')).toBeOnTheScreen();
    expect(signUpEmail).not.toHaveBeenCalled();

    await fill('Password', 'analytical');
    await press('Create account');

    expect(signUpEmail).toHaveBeenCalledWith({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'analytical' });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('drops the waiting action when closed without signing in', async () => {
    const waiting = jest.fn();
    useAccountGate.getState().hold(waiting);
    await renderSignIn();

    await act(async () => {
      screen.unmount();
    });

    expect(useAccountGate.getState().pending).toBeNull();
    expect(waiting).not.toHaveBeenCalled();
  });
});
