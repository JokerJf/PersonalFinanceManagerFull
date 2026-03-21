// Unit tests for family validator schemas

import {
  CreateGroupSchema,
  JoinGroupSchema,
  InviteByEmailSchema,
  RequestIdParamSchema,
  MemberIdParamSchema,
} from '../../src/validators/family.validator';

describe('CreateGroupSchema', () => {
  it('accepts valid group name', () => {
    const result = CreateGroupSchema.parse({ name: 'Семья Каримовых' });
    expect(result.name).toBe('Семья Каримовых');
  });

  it('rejects empty name', () => {
    expect(() => CreateGroupSchema.parse({ name: '' })).toThrow();
  });

  it('rejects name over 100 chars', () => {
    expect(() => CreateGroupSchema.parse({ name: 'a'.repeat(101) })).toThrow();
  });
});

describe('JoinGroupSchema', () => {
  it('accepts valid invite code', () => {
    const result = JoinGroupSchema.parse({ inviteCode: 'ABC123XY' });
    expect(result.inviteCode).toBe('ABC123XY');
  });

  it('rejects missing invite code', () => {
    expect(() => JoinGroupSchema.parse({})).toThrow();
  });
});

describe('InviteByEmailSchema', () => {
  it('accepts valid email', () => {
    const result = InviteByEmailSchema.parse({ email: 'friend@example.com' });
    expect(result.email).toBe('friend@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => InviteByEmailSchema.parse({ email: 'not-an-email' })).toThrow();
  });
});

describe('RequestIdParamSchema', () => {
  it('coerces string id to number', () => {
    const result = RequestIdParamSchema.parse({ id: '42' });
    expect(result.id).toBe(42);
  });

  it('rejects non-numeric id', () => {
    expect(() => RequestIdParamSchema.parse({ id: 'abc' })).toThrow();
  });
});

describe('MemberIdParamSchema', () => {
  it('coerces memberId string to number', () => {
    const result = MemberIdParamSchema.parse({ memberId: '7' });
    expect(result.memberId).toBe(7);
  });
});
