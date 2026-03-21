import { FindOptionsWhere, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Transaction, TransactionType } from '../entity/Transaction';
import { Account } from '../entity/Account';
import { ApiError } from '../middleware/errorHandler';
import { resolveWorkspaceConditions, resolveFamilyGroupId } from './workspace.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionQuerySchema } from '../validators/transaction.validator';
import { Workspace } from '../types';
import { z } from 'zod';

const txRepo = () => AppDataSource.getRepository(Transaction);
const acRepo = () => AppDataSource.getRepository(Account);

type TransactionQuery = z.infer<typeof TransactionQuerySchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeType(type: string): string {
  return type.toUpperCase();
}

async function findAccount(
  id: number,
  familyGroupId: number | null,
  userId: number,
): Promise<Account | null> {
  const where: FindOptionsWhere<Account> = familyGroupId
    ? { id, familyGroupId }
    : { id, userId, familyGroupId: IsNull() };
  return acRepo().findOne({ where });
}

function applyBalanceChange(account: Account, type: string, amount: number, direction: 'add' | 'remove'): void {
  const normalised = normalizeType(type);
  const sign = direction === 'add' ? 1 : -1;

  if (normalised === 'INCOME') {
    account.balance = Number(account.balance) + sign * Number(amount);
  } else if (normalised === 'EXPENSE') {
    account.balance = Number(account.balance) - sign * Number(amount);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listTransactions(userId: number, query: TransactionQuery) {
  const conditions = await resolveWorkspaceConditions<Transaction>(userId, query.workspace);

  const qb = txRepo().createQueryBuilder('t');

  if ('familyGroupId' in conditions && typeof conditions.familyGroupId === 'number') {
    qb.where('t.familyGroupId = :familyGroupId', { familyGroupId: conditions.familyGroupId });
  } else {
    qb.where('t.userId = :userId AND t.familyGroupId IS NULL', { userId });
  }

  if (query.startDate) qb.andWhere('t.date >= :startDate', { startDate: query.startDate });
  if (query.endDate) qb.andWhere('t.date <= :endDate', { endDate: query.endDate });
  if (query.type) qb.andWhere('t.type = :type', { type: query.type });
  if (query.accountId) qb.andWhere('t.accountId = :accountId', { accountId: query.accountId });

  return qb.orderBy('t.date', 'DESC').getMany();
}

export async function createTransaction(userId: number, dto: CreateTransactionDto) {
  return AppDataSource.transaction(async (manager) => {
    const familyGroupId = await resolveFamilyGroupId(
      userId,
      dto.workspace,
      'Вы не состоите в семейной группе. Создайте или присоединитесь к семейной группе для выполнения операций в режиме Family.',
    );

    const account = await findAccount(dto.accountId, familyGroupId, userId);
    if (!account) throw new ApiError('Account not found', 404);

    const normalised = normalizeType(dto.type);

    // TRANSFER creates two separate transactions atomically
    if (normalised === 'TRANSFER' && dto.toAccountId) {
      const toAccount = await findAccount(dto.toAccountId, familyGroupId, userId);
      if (!toAccount) throw new ApiError('Destination account not found', 404);

      account.balance = Number(account.balance) - Number(dto.amount);
      toAccount.balance = Number(toAccount.balance) + Number(dto.toAmount ?? dto.amount);

      const outTx = manager.create(Transaction, {
        ...dto,
        date: new Date(dto.date),
        type: TransactionType.EXPENSE,
        category: 'Transfer',
        icon: dto.icon ?? 'ArrowUpRight',
        toAccountName: dto.toAccountName ?? toAccount.name,
        userId,
        familyGroupId,
      });

      const inTx = manager.create(Transaction, {
        amount: dto.toAmount ?? dto.amount,
        description: dto.description,
        date: new Date(dto.date),
        type: TransactionType.INCOME,
        category: 'Transfer',
        currency: dto.toCurrency ?? dto.currency,
        accountId: dto.toAccountId,
        accountName: dto.toAccountName ?? toAccount.name,
        toAccountId: dto.accountId,
        toAccountName: dto.accountName,
        toCurrency: dto.currency,
        toAmount: dto.amount,
        icon: dto.icon ?? 'ArrowDownLeft',
        note: dto.note,
        userId,
        familyGroupId,
      });

      await manager.save(Account, [account, toAccount]);
      const saved = await manager.save(Transaction, [outTx, inTx]);
      return saved;
    }

    // INCOME / EXPENSE
    applyBalanceChange(account, normalised, dto.amount, 'add');
    await manager.save(Account, account);

    const transaction = manager.create(Transaction, {
      ...dto,
      date: new Date(dto.date),
      type: dto.type as TransactionType,
      userId,
      familyGroupId,
    });
    return manager.save(Transaction, transaction);
  });
}

export async function updateTransaction(id: number, userId: number, dto: UpdateTransactionDto) {
  return AppDataSource.transaction(async (manager) => {
    const existing = await manager.findOne(Transaction, { where: { id } });
    if (!existing) throw new ApiError('Transaction not found', 404);

    // Access check
    if (existing.familyGroupId) {
      const { User } = await import('../entity/User');
      const user = await manager.findOne(User, { where: { id: userId } });
      if (user?.familyGroupId !== existing.familyGroupId) throw new ApiError('Transaction not found', 404);
    } else if (existing.userId !== userId) {
      throw new ApiError('Transaction not found', 404);
    }

    const numericAccountId = Number(dto.accountId);
    const numericToAccountId = dto.toAccountId ? Number(dto.toAccountId) : undefined;
    const sameAccount = existing.accountId === numericAccountId;

    const oldAccount = await findAccount(existing.accountId, existing.familyGroupId, userId);
    const newAccount = await findAccount(numericAccountId, existing.familyGroupId, userId);
    if (!newAccount) throw new ApiError('Account not found', 404);

    const oldType = normalizeType(existing.type);
    const newType = normalizeType(dto.type);

    if (sameAccount) {
      // Revert old effect then apply new effect on the same account
      applyBalanceChange(newAccount, oldType, Number(existing.amount), 'remove');

      // For old TRANSFER revert destination account too
      if (oldType === 'TRANSFER' && existing.toAccountId) {
        const oldTo = await findAccount(existing.toAccountId, existing.familyGroupId, userId);
        if (oldTo) {
          oldTo.balance = Number(oldTo.balance) - Number(existing.toAmount ?? existing.amount);
          await manager.save(Account, oldTo);
        }
      }

      applyBalanceChange(newAccount, newType, Number(dto.amount), 'add');

      if (newType === 'TRANSFER' && numericToAccountId) {
        const newTo = await findAccount(numericToAccountId, existing.familyGroupId, userId);
        if (newTo) {
          newTo.balance = Number(newTo.balance) + Number(dto.toAmount ?? dto.amount);
          await manager.save(Account, newTo);
        }
      }
    } else {
      // Account changed — revert old account, apply to new account
      if (oldAccount) {
        applyBalanceChange(oldAccount, oldType, Number(existing.amount), 'remove');
        if (oldType === 'TRANSFER' && existing.toAccountId) {
          const oldTo = await findAccount(existing.toAccountId, existing.familyGroupId, userId);
          if (oldTo) {
            oldTo.balance = Number(oldTo.balance) - Number(existing.toAmount ?? existing.amount);
            await manager.save(Account, oldTo);
          }
        }
        await manager.save(Account, oldAccount);
      }

      applyBalanceChange(newAccount, newType, Number(dto.amount), 'add');

      if (newType === 'TRANSFER' && numericToAccountId) {
        const newTo = await findAccount(numericToAccountId, existing.familyGroupId, userId);
        if (newTo) {
          newTo.balance = Number(newTo.balance) + Number(dto.toAmount ?? dto.amount);
          await manager.save(Account, newTo);
        }
      }
    }

    await manager.save(Account, newAccount);

    Object.assign(existing, {
      ...dto,
      accountId: numericAccountId,
      toAccountId: numericToAccountId,
      date: new Date(dto.date),
      type: dto.type as TransactionType,
    });

    return manager.save(Transaction, existing);
  });
}

export async function deleteTransaction(id: number, userId: number, workspace: Workspace) {
  return AppDataSource.transaction(async (manager) => {
    const conditions = await resolveWorkspaceConditions<Transaction>(userId, workspace);
    const transaction = await manager.findOne(Transaction, { where: { id, ...conditions } as FindOptionsWhere<Transaction> });
    if (!transaction) throw new ApiError('Transaction not found', 404);

    const account = await findAccount(transaction.accountId, transaction.familyGroupId, userId);
    if (account) {
      const type = normalizeType(transaction.type);
      applyBalanceChange(account, type, Number(transaction.amount), 'remove');

      if (type === 'TRANSFER' && transaction.toAccountId) {
        const toAccount = await findAccount(transaction.toAccountId, transaction.familyGroupId, userId);
        if (toAccount) {
          toAccount.balance = Number(toAccount.balance) - Number(transaction.toAmount ?? transaction.amount);
          await manager.save(Account, toAccount);
        }
      }
      await manager.save(Account, account);
    }

    await manager.delete(Transaction, { id, ...conditions } as FindOptionsWhere<Transaction>);
  });
}
