import { validateSignIn } from './validation';

const valid = { name: 'Ada', email: 'ada@example.com', password: 'analytical' };

describe('validateSignIn', () => {
  it('accepts a complete form', () => {
    expect(validateSignIn('signUp', valid)).toEqual({});
    expect(validateSignIn('signIn', valid)).toEqual({});
  });

  it('asks for a name, a real-looking email and 8+ characters when signing up', () => {
    expect(validateSignIn('signUp', { name: '  ', email: 'ada@', password: 'short' })).toEqual({
      name: 'nameRequired',
      email: 'emailInvalid',
      password: 'passwordTooShort',
    });
  });

  it('only needs an email and some password to sign in', () => {
    expect(validateSignIn('signIn', { name: '', email: ' ada@example.com ', password: 'x' })).toEqual({});
    expect(validateSignIn('signIn', { name: '', email: 'ada@example.com', password: '' })).toEqual({
      password: 'passwordTooShort',
    });
  });
});
