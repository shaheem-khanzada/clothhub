export type SignInMode = 'signIn' | 'signUp';

export type SignInValues = {
  name: string;
  email: string;
  password: string;
};

/** The `auth.validation` key for each field that needs fixing. */
export type SignInErrors = Partial<Record<keyof SignInValues, 'nameRequired' | 'emailInvalid' | 'passwordTooShort'>>;

export const MIN_PASSWORD_LENGTH = 8;

// Good enough to catch typos; the server has the final say.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks the form before it is sent. Sign-in only checks that the email looks like one. */
export function validateSignIn(mode: SignInMode, { name, email, password }: SignInValues): SignInErrors {
  const errors: SignInErrors = {};

  if (mode === 'signUp' && !name.trim()) {
    errors.name = 'nameRequired';
  }

  if (!EMAIL.test(email.trim())) {
    errors.email = 'emailInvalid';
  }

  if (mode === 'signUp' ? password.length < MIN_PASSWORD_LENGTH : password.length === 0) {
    errors.password = 'passwordTooShort';
  }

  return errors;
}
