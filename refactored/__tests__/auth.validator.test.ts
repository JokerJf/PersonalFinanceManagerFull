import { RegisterSchema, LoginSchema, ChangePasswordSchema, UpdateProfileSchema } from '../../src/validators/auth.validator';

// ─── Validator unit tests (no DB needed) ──────────────────────────────────────

describe('RegisterSchema', () => {
  const valid = { email: 'user@example.com', password: 'secret123', firstName: 'Ali', lastName: 'Karimov' };

  it('accepts valid registration data', () => {
    expect(() => RegisterSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => RegisterSchema.parse({ ...valid, email: 'not-an-email' })).toThrow();
  });

  it('rejects short password', () => {
    expect(() => RegisterSchema.parse({ ...valid, password: '123' })).toThrow();
  });

  it('rejects missing firstName', () => {
    expect(() => RegisterSchema.parse({ ...valid, firstName: '' })).toThrow();
  });
});

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    expect(() => LoginSchema.parse({ email: 'a@b.com', password: 'anypass' })).not.toThrow();
  });

  it('rejects missing password', () => {
    expect(() => LoginSchema.parse({ email: 'a@b.com', password: '' })).toThrow();
  });
});

describe('ChangePasswordSchema', () => {
  it('accepts valid payload', () => {
    const result = ChangePasswordSchema.parse({ currentPassword: 'old', newPassword: 'newpass1' });
    expect(result.newPassword).toBe('newpass1');
  });

  it('rejects short new password', () => {
    expect(() => ChangePasswordSchema.parse({ currentPassword: 'old', newPassword: '123' })).toThrow();
  });
});

describe('UpdateProfileSchema', () => {
  it('accepts partial updates', () => {
    const result = UpdateProfileSchema.parse({ firstName: 'Bob' });
    expect(result.firstName).toBe('Bob');
    expect(result.email).toBeUndefined();
  });

  it('rejects invalid email', () => {
    expect(() => UpdateProfileSchema.parse({ email: 'not-email' })).toThrow();
  });
});
