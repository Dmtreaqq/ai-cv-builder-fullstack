import { validateCredentials } from './validate-credentials';

describe('validateCredentials', () => {
  it('requires a valid email and a password', () => {
    expect(validateCredentials({ email: '', password: '' })).toEqual({
      email: 'Enter your email.',
      password: 'Enter a password.',
    });
    expect(validateCredentials({ email: 'nope', password: 'x' })).toEqual({
      email: 'Enter a valid email, like name@example.com.',
    });
  });

  it('accepts any non-empty password when logging in', () => {
    expect(validateCredentials({ email: 'a@b.co', password: 'x' }, 'login')).toEqual({});
  });

  it('requires 8 to 72 characters when registering', () => {
    const email = 'a@b.co';

    expect(validateCredentials({ email, password: 'a'.repeat(7) }, 'register')).toEqual({
      password: 'Password must be at least 8 characters.',
    });
    expect(validateCredentials({ email, password: 'a'.repeat(73) }, 'register')).toEqual({
      password: 'Password must be at most 72 characters.',
    });
    expect(validateCredentials({ email, password: 'a'.repeat(8) }, 'register')).toEqual({});
    expect(validateCredentials({ email, password: 'a'.repeat(72) }, 'register')).toEqual({});
  });
});
