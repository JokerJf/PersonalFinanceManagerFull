import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Debt } from '../entity/Debt';
import { Credit } from '../entity/Credit';
import { Transaction, TransactionType } from '../entity/Transaction';
import { Account } from '../entity/Account';
import { Notification } from '../entity/Notification';
import { ApiError } from '../middleware/errorHandler';
import { resolveWorkspaceConditions, resolveFamilyGroupId } from './workspace.service';
import { CreateDebtDto, UpdateDebtDto, CreateCreditDto, UpdateCreditDto } from '../validators/finance.validator';
import { Workspace } from '../types';

// ─── Debts ────────────────────────────────────────────────────────────────────

const debtRepo = () => AppDataSource.getRepository(Debt);

export async function listDebts(userId: number, workspace: Workspace) {
  const conditions = await resolveWorkspaceConditions<Debt>(userId, workspace);
  return debtRepo().find({ where: conditions, order: { createdAt: 'DESC' } });
}

export async function createDebt(userId: number, dto: CreateDebtDto) {
  const familyGroupId = await resolveFamilyGroupId(
    userId,
    dto.workspace,
    'Вы не состоите в семейной группе.',
  );

  const debt = debtRepo().create({
    ...dto,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    date: dto.date ? new Date(dto.date) : new Date(),
    userId,
    familyGroupId,
  });
  return debtRepo().save(debt);
}

export async function updateDebt(id: number, userId: number, workspace: Workspace, dto: UpdateDebtDto) {
  const conditions = await resolveWorkspaceConditions<Debt>(userId, workspace);
  const debt = await debtRepo().findOne({ where: { id, ...conditions } as FindOptionsWhere<Debt> });
  if (!debt) throw new ApiError('Debt not found', 404);

  Object.assign(debt, {
    ...dto,
    dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : debt.dueDate,
    date: dto.date ? new Date(dto.date) : debt.date,
    isPaid: dto.status !== undefined ? dto.status === 'closed' : debt.isPaid,
  });

  return debtRepo().save(debt);
}

export async function deleteDebt(id: number, userId: number, workspace: Workspace) {
  const conditions = await resolveWorkspaceConditions<Debt>(userId, workspace);
  const result = await debtRepo().delete({ id, ...conditions } as FindOptionsWhere<Debt>);
  if (result.affected === 0) throw new ApiError('Debt not found', 404);
}

// ─── Credits ──────────────────────────────────────────────────────────────────

const creditRepo = () => AppDataSource.getRepository(Credit);

export async function listCredits(userId: number) {
  return creditRepo().find({ where: { userId }, order: { createdAt: 'DESC' } });
}

export async function createCredit(userId: number, dto: CreateCreditDto) {
  const credit = creditRepo().create({
    ...dto,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    endDate: dto.endDate ? new Date(dto.endDate) : null,
    userId,
  });
  return creditRepo().save(credit);
}

export async function updateCredit(id: number, userId: number, dto: UpdateCreditDto) {
  const credit = await creditRepo().findOne({ where: { id, userId } });
  if (!credit) throw new ApiError('Credit not found', 404);

  Object.assign(credit, {
    ...dto,
    startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : credit.startDate,
    endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : credit.endDate,
  });

  return creditRepo().save(credit);
}

export async function deleteCredit(id: number, userId: number) {
  const result = await creditRepo().delete({ id, userId });
  if (result.affected === 0) throw new ApiError('Credit not found', 404);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalyticsSummary(userId: number, startDate?: string, endDate?: string) {
  const txRepo = AppDataSource.getRepository(Transaction);
  const qb = txRepo.createQueryBuilder('t').where('t.userId = :userId', { userId });
  if (startDate) qb.andWhere('t.date >= :startDate', { startDate });
  if (endDate) qb.andWhere('t.date <= :endDate', { endDate });

  const transactions = await qb.getMany();

  const income = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return { totalIncome: income, totalExpenses: expenses, balance: income - expenses };
}

export async function getAnalyticsByCategory(userId: number, startDate?: string, endDate?: string) {
  const txRepo = AppDataSource.getRepository(Transaction);
  const qb = txRepo
    .createQueryBuilder('t')
    .where('t.userId = :userId', { userId })
    .andWhere('t.type = :type', { type: TransactionType.EXPENSE });
  if (startDate) qb.andWhere('t.date >= :startDate', { startDate });
  if (endDate) qb.andWhere('t.date <= :endDate', { endDate });

  const transactions = await qb.getMany();

  const byCategory: Record<string, number> = {};
  transactions.forEach((t) => {
    const cat = t.category || 'Other';
    byCategory[cat] = (byCategory[cat] ?? 0) + Number(t.amount);
  });
  return byCategory;
}

export async function getAccountsSummary(userId: number) {
  const accounts = await AppDataSource.getRepository(Account).find({
    where: { userId, isActive: true },
  });
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  return { totalBalance, accounts };
}

// ─── Notifications ────────────────────────────────────────────────────────────

const notifRepo = () => AppDataSource.getRepository(Notification);

export async function listNotifications(userId: number) {
  return notifRepo().find({ where: { userId }, order: { createdAt: 'DESC' } });
}

export async function markNotificationRead(id: number, userId: number) {
  const notification = await notifRepo().findOne({ where: { id, userId } });
  if (!notification) throw new ApiError('Notification not found', 404);
  notification.isRead = true;
  return notifRepo().save(notification);
}

export async function createNotification(
  userId: number,
  data: { title: string; message: string; type?: string },
) {
  const notif = notifRepo().create({ ...data, type: data.type ?? 'info', userId, isRead: false });
  return notifRepo().save(notif);
}

export async function deleteNotification(id: number, userId: number) {
  const result = await notifRepo().delete({ id, userId });
  if (result.affected === 0) throw new ApiError('Notification not found', 404);
}
