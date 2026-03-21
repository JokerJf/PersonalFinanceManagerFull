import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Account } from '../entity/Account';
import { Transaction } from '../entity/Transaction';
import { ApiError } from '../middleware/errorHandler';
import { resolveWorkspaceConditions, resolveFamilyGroupId } from './workspace.service';
import { CreateAccountDto, UpdateAccountDto } from '../validators/account.validator';
import { Workspace } from '../types';

const repo = () => AppDataSource.getRepository(Account);

export async function listAccounts(userId: number, workspace: Workspace) {
  const conditions = await resolveWorkspaceConditions<Account>(userId, workspace);
  return repo().find({ where: conditions, order: { createdAt: 'DESC' } });
}

export async function listAccountCurrencies(userId: number, workspace: Workspace) {
  const conditions = await resolveWorkspaceConditions<Account>(userId, workspace);
  const accounts = await repo().find({ where: conditions, select: ['currency'] });
  return [...new Set(accounts.map((a) => a.currency))].sort();
}

export async function getAccount(id: number, userId: number, workspace: Workspace) {
  const conditions = await resolveWorkspaceConditions<Account>(userId, workspace);
  const account = await repo().findOne({ where: { id, ...conditions } as FindOptionsWhere<Account> });
  if (!account) throw new ApiError('Account not found', 404);
  return account;
}

export async function createAccount(userId: number, dto: CreateAccountDto) {
  const familyGroupId = await resolveFamilyGroupId(
    userId,
    dto.workspace,
    'Вы не состоите в семейной группе. Создайте или присоединитесь к семейной группе для выполнения операций в режиме Family.',
  );

  const account = repo().create({ ...dto, userId, familyGroupId });
  return repo().save(account);
}

export async function updateAccount(id: number, userId: number, workspace: Workspace, dto: UpdateAccountDto) {
  const conditions = await resolveWorkspaceConditions<Account>(userId, workspace);
  const account = await repo().findOne({ where: { id, ...conditions } as FindOptionsWhere<Account> });
  if (!account) throw new ApiError('Account not found', 404);

  Object.assign(account, dto);
  return repo().save(account);
}

export async function deleteAccount(id: number, userId: number, workspace: Workspace) {
  const conditions = await resolveWorkspaceConditions<Account>(userId, workspace);
  const account = await repo().findOne({ where: { id, ...conditions } as FindOptionsWhere<Account> });
  if (!account) throw new ApiError('Account not found', 404);

  const txRepo = AppDataSource.getRepository(Transaction);
  await txRepo.delete({ accountId: id });
  await txRepo.delete({ toAccountId: id });
  await repo().delete({ id, ...conditions } as FindOptionsWhere<Account>);
}
