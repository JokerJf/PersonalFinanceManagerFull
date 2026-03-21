import { CreateAccountSchema, UpdateAccountSchema } from '../../src/validators/account.validator';
import { CreateTransactionSchema, TransactionQuerySchema } from '../../src/validators/transaction.validator';
import { CreateDebtSchema, CreateCreditSchema, CreateBudgetSchema } from '../../src/validators/finance.validator';

// ─── Account ──────────────────────────────────────────────────────────────────

describe('CreateAccountSchema', () => {
  const valid = { name: 'Наличные', currency: 'UZS', workspace: 'personal' as const };

  it('accepts valid account data with defaults', () => {
    const result = CreateAccountSchema.parse(valid);
    expect(result.balance).toBe(0);
    expect(result.type).toBe('CASH');
    expect(result.includedInBalance).toBe(true);
  });

  it('rejects empty name', () => {
    expect(() => CreateAccountSchema.parse({ ...valid, name: '' })).toThrow();
  });

  it('rejects currency not 3 chars', () => {
    expect(() => CreateAccountSchema.parse({ ...valid, currency: 'US' })).toThrow();
  });

  it('accepts family workspace', () => {
    const result = CreateAccountSchema.parse({ ...valid, workspace: 'family' });
    expect(result.workspace).toBe('family');
  });
});

describe('UpdateAccountSchema', () => {
  it('accepts partial update', () => {
    const result = UpdateAccountSchema.parse({ name: 'Карта' });
    expect(result.name).toBe('Карта');
    expect(result.currency).toBeUndefined();
  });

  it('rejects empty name if provided', () => {
    expect(() => UpdateAccountSchema.parse({ name: '' })).toThrow();
  });
});

// ─── Transaction ──────────────────────────────────────────────────────────────

describe('CreateTransactionSchema', () => {
  const valid = {
    amount: 100000,
    date: '2024-01-15T10:00:00.000Z',
    type: 'INCOME' as const,
    accountId: 1,
    currency: 'UZS',
    workspace: 'personal' as const,
  };

  it('accepts valid transaction', () => {
    const result = CreateTransactionSchema.parse(valid);
    expect(result.amount).toBe(100000);
    expect(result.type).toBe('INCOME');
  });

  it('rejects non-positive amount', () => {
    expect(() => CreateTransactionSchema.parse({ ...valid, amount: -50 })).toThrow();
    expect(() => CreateTransactionSchema.parse({ ...valid, amount: 0 })).toThrow();
  });

  it('accepts string accountId and coerces to number', () => {
    const result = CreateTransactionSchema.parse({ ...valid, accountId: '42' });
    expect(result.accountId).toBe(42);
  });

  it('rejects invalid transaction type', () => {
    expect(() => CreateTransactionSchema.parse({ ...valid, type: 'INVALID' })).toThrow();
  });
});

describe('TransactionQuerySchema', () => {
  it('uses personal workspace by default', () => {
    const result = TransactionQuerySchema.parse({});
    expect(result.workspace).toBe('personal');
  });

  it('parses accountId string to number', () => {
    const result = TransactionQuerySchema.parse({ accountId: '5' });
    expect(result.accountId).toBe(5);
  });

  it('rejects non-numeric accountId', () => {
    expect(() => TransactionQuerySchema.parse({ accountId: 'abc' })).toThrow();
  });
});

// ─── Debt ─────────────────────────────────────────────────────────────────────

describe('CreateDebtSchema', () => {
  const valid = { name: 'Долг другу', amount: 500, workspace: 'personal' as const };

  it('accepts valid debt with defaults', () => {
    const result = CreateDebtSchema.parse(valid);
    expect(result.currency).toBe('USD');
    expect(result.type).toBe('owe');
    expect(result.status).toBe('open');
  });

  it('rejects non-positive amount', () => {
    expect(() => CreateDebtSchema.parse({ ...valid, amount: 0 })).toThrow();
  });
});

// ─── Credit ───────────────────────────────────────────────────────────────────

describe('CreateCreditSchema', () => {
  const valid = { name: 'Ипотека', totalAmount: 50000000 };

  it('accepts valid credit with defaults', () => {
    const result = CreateCreditSchema.parse(valid);
    expect(result.currency).toBe('USD');
    expect(result.months).toBe(1);
    expect(result.status).toBe('active');
  });

  it('rejects zero totalAmount', () => {
    expect(() => CreateCreditSchema.parse({ ...valid, totalAmount: 0 })).toThrow();
  });
});

// ─── Budget ───────────────────────────────────────────────────────────────────

describe('CreateBudgetSchema', () => {
  const valid = { monthKey: '2024-01' };

  it('accepts valid monthKey with defaults', () => {
    const result = CreateBudgetSchema.parse(valid);
    expect(result.totalIncomePlan).toBe(0);
    expect(result.totalExpensePlan).toBe(0);
  });

  it('rejects malformed monthKey', () => {
    expect(() => CreateBudgetSchema.parse({ monthKey: '2024-1' })).toThrow();
    expect(() => CreateBudgetSchema.parse({ monthKey: '01-2024' })).toThrow();
  });

  it('validates categoryLimits shape', () => {
    const result = CreateBudgetSchema.parse({
      ...valid,
      categoryLimits: [{ category: 'Food', limitAmount: 500000 }],
    });
    expect(result.categoryLimits).toHaveLength(1);
  });
});
