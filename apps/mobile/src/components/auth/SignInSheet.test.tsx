import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { useAccountGate } from '@/domain/auth/session';
import { SIGN_IN_SHEET } from '@/domain/auth/signInSheet';
import { authClient } from '@/lib/authClient';
import { createQueryWrapper } from '@/test-utils/queryClient';

import { SignInSheet } from './SignInSheet';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

const signInEmail = jest.mocked(authClient.signIn.email);
const signUpEmail = jest.mocked(authClient.signUp.email);
const dismiss = jest.mocked(TrueSheet.dismiss);

async function renderSheet() {
  await render(<SignInSheet />, { wrapper: createQueryWrapper() });
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

/** What TrueSheet does when the person swipes the sheet away (the mock keeps mounted sheets by name). */
async function swipeAway() {
  const sheets = (TrueSheet as unknown as { instances: Record<string, { props: { onDidDismiss: () => void } }> }).instances;

  await act(async () => {
    sheets[SIGN_IN_SHEET]?.props.onDidDismiss();
  });
}

beforeEach(() => {
  signInEmail.mockClear();
  signUpEmail.mockClear();
  dismiss.mockClear();
  useAccountGate.getState().clear();
});

describe('SignInSheet', () => {
  it('signs in with email and password, runs the waiting action and closes', async () => {
    const waiting = jest.fn();
    useAccountGate.getState().hold(waiting);
    await renderSheet();

    await fill('Email', ' ada@example.com ');
    await fill('Password', 'analytical');
    await press('Sign in');

    expect(signInEmail).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'analytical' });
    expect(waiting).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledWith(SIGN_IN_SHEET);
  });

  it('points out what to fix before sending anything', async () => {
    await renderSheet();

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
    await renderSheet();

    await fill('Email', 'ada@example.com');
    await fill('Password', 'wrong-one');
    await press('Sign in');

    expect(screen.getByText('That email and password don’t match.')).toBeOnTheScreen();
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('creates an account with a name', async () => {
    await renderSheet();

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
    expect(dismiss).toHaveBeenCalledWith(SIGN_IN_SHEET);
  });

  it('drops the waiting action and starts fresh when swiped away', async () => {
    const waiting = jest.fn();
    useAccountGate.getState().hold(waiting);
    await renderSheet();

    await press('Create an account');
    await fill('Email', 'half-typed@');
    await swipeAway();

    expect(useAccountGate.getState().pending).toBeNull();
    expect(waiting).not.toHaveBeenCalled();
    expect(screen.getByText('Welcome back')).toBeOnTheScreen();
    expect(screen.getByLabelText('Email').props.value).toBe('');
  });
});
