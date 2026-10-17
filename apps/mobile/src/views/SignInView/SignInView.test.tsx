import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

import { apiClient } from '@/axios';

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
jest.mock('expo-crypto', () => ({ randomUUID: () => 'nonce-1' }));
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const signInEmail = jest.mocked(authClient.signIn.email);
const signUpEmail = jest.mocked(authClient.signUp.email);
const signInSocial = jest.mocked(authClient.signIn.social);
const appleSignIn = jest.mocked(AppleAuthentication.signInAsync);
const googleSignIn = jest.mocked(GoogleSignin.signIn);
const api = new MockAdapter(apiClient);

/** What Apple's sheet returns on a first sign-in. */
const APPLE_CREDENTIAL = {
  user: 'apple-user-1',
  identityToken: 'identity-token',
  authorizationCode: 'code-1',
  fullName: { givenName: 'Ada', familyName: 'Lovelace' },
  email: 'ada@privaterelay.appleid.com',
  realUserStatus: 1,
  state: null,
} as unknown as AppleAuthentication.AppleAuthenticationCredential;

async function renderSignIn() {
  await render(<SignInView />, { wrapper: createQueryWrapper() });
}

async function fill(label: string, value: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText(label), value);
  });
}

/** Lets React Query deliver what it has batched (it notifies on the next tick). */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
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
  signInSocial.mockClear();
  appleSignIn.mockReset();
  googleSignIn.mockReset();
  api.reset();
  useAccountGate.getState().clear();
});

describe('SignInView', () => {
  it('signs in with Apple, keeps the code for revoking, runs the waiting action and closes', async () => {
    const waiting = jest.fn();
    useAccountGate.getState().hold(waiting);
    appleSignIn.mockResolvedValue(APPLE_CREDENTIAL);
    api.onPost('/v1/me/apple-authorization').reply(204);
    await renderSignIn();

    await press('Continue with Apple');
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));

    expect(appleSignIn).toHaveBeenCalledWith(expect.objectContaining({ nonce: 'nonce-1' }));
    expect(signInSocial).toHaveBeenCalledWith({
      provider: 'apple',
      idToken: {
        token: 'identity-token',
        nonce: 'nonce-1',
        user: { name: { firstName: 'Ada', lastName: 'Lovelace' } },
      },
    });
    expect(JSON.parse(api.history.post[0]!.data)).toEqual({ authorizationCode: 'code-1' });
    expect(waiting).toHaveBeenCalledTimes(1);
  });

  it('stays open, quietly, when the person closes Apple\'s sheet', async () => {
    appleSignIn.mockRejectedValue(Object.assign(new Error('canceled'), { code: 'ERR_REQUEST_CANCELED' }));
    await renderSignIn();

    await press('Continue with Apple');
    await waitFor(() => expect(appleSignIn).toHaveBeenCalled());
    await settle();

    expect(signInSocial).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.queryByText('Something went wrong. Please try again.')).toBeNull();
  });

  it('says so when Apple sign-in fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    appleSignIn.mockResolvedValue(APPLE_CREDENTIAL);
    signInSocial.mockResolvedValueOnce({ data: null, error: { code: 'INVALID_TOKEN', message: 'Invalid token', status: 401 } } as never);
    await renderSignIn();

    await press('Continue with Apple');

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[apple sign-in] the API refused the identity token', expect.objectContaining({ status: 401 }));
    warn.mockRestore();
  });

  it('signs in with Google, runs the waiting action and closes', async () => {
    const waiting = jest.fn();
    useAccountGate.getState().hold(waiting);
    googleSignIn.mockResolvedValue({ type: 'success', data: { idToken: 'google-id-token' } } as never);
    await renderSignIn();

    await press('Continue with Google');
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));

    expect(GoogleSignin.configure).toHaveBeenCalledWith(
      expect.objectContaining({ webClientId: expect.stringContaining('.apps.googleusercontent.com') }),
    );
    expect(signInSocial).toHaveBeenCalledWith({ provider: 'google', idToken: { token: 'google-id-token' } });
    expect(waiting).toHaveBeenCalledTimes(1);
  });

  it('stays open, quietly, when the person closes Google\'s sheet', async () => {
    googleSignIn.mockResolvedValue({ type: 'cancelled', data: null } as never);
    await renderSignIn();

    await press('Continue with Google');
    await waitFor(() => expect(googleSignIn).toHaveBeenCalled());
    await settle();

    expect(signInSocial).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.queryByText('Something went wrong. Please try again.')).toBeNull();
  });

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
