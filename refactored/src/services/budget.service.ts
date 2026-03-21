import { AppDataSource } from '../config/database';
import { BudgetPlan } from '../entity/BudgetPlan';
import { DeepPartial } from 'typeorm';
import { BudgetCategoryLimit } from '../entity/BudgetCategoryLimit';
import { BudgetIncomePlanItem } from '../entity/BudgetIncomePlanItem';
import { Transaction, TransactionType } from '../entity/Transaction';
import { ApiError } from '../middleware/errorHandler';
import { CreateBudgetDto, UpdateBudgetDto } from '../validators/finance.validator';

const budgetRepo = () => AppDataSource.getRepository(BudgetPlan);
const limitRepo = () => AppDataSource.getRepository(BudgetCategoryLimit);
const incomeRepo = () => AppDataSource.getRepository(BudgetIncomePlanItem);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function saveCategoryLimits(budgetId: number, items: { category: string; limitAmount: number }[]) {
  if (!items.length) return;
  const limits = items.map((item) =>
    limitRepo().create({ budgetPlanId: budgetId, category: item.category, limit: item.limitAmount }),
  );
  await limitRepo().save(limits);
}

async function saveIncomePlanItems(budgetId: number, items: { category: string; plannedAmount: number }[]) {
  if (!items.length) return;
  const rows = items.map((item) =>
    incomeRepo().create({ budgetPlanId: budgetId, category: item.category, plannedAmount: item.plannedAmount }),
  );
  await incomeRepo().save(rows);
}

async function findBudgetWithRelations(budgetId: number) {
  return budgetRepo().findOne({
    where: { id: budgetId },
    relations: ['categoryLimits', 'incomePlanItems'],
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listBudgets(userId: number, accountId?: string) {
  const where: Record<string, unknown> = { userId };
  if (accountId) where.accountId = accountId;
  return budgetRepo().find({ where, relations: ['categoryLimits', 'incomePlanItems'], order: { monthKey: 'DESC' } });
}

export async function getBudgetByMonth(userId: number, monthKey: string, accountId?: string) {
  const where: Record<string, unknown> = { userId, monthKey };
  if (accountId !== undefined && accountId !== null) {
    where.accountId = accountId;
  }
  return budgetRepo().findOne({ where, relations: ['categoryLimits', 'incomePlanItems'] });
}

export async function createBudget(userId: number, dto: CreateBudgetDto) {
  return AppDataSource.transaction(async (manager) => {
    const accountId = dto.accountId !== undefined && dto.accountId !== null ? String(dto.accountId) : null;
    const budgetData = {
      monthKey: dto.monthKey,
      accountId,
      totalIncomePlan: dto.totalIncomePlan ?? 0,
      totalExpensePlan: dto.totalExpensePlan ?? 0,
      userId,
    } as DeepPartial<BudgetPlan>;
    const budget = manager.create(BudgetPlan, budgetData);
    const saved = await manager.save(BudgetPlan, budget);

    if (dto.categoryLimits?.length) await saveCategoryLimits(saved.id, dto.categoryLimits);
    if (dto.incomePlanItems?.length) await saveIncomePlanItems(saved.id, dto.incomePlanItems);

    // Return with relations using the same manager
    const result = await manager.findOne(BudgetPlan, {
      where: { id: saved.id },
      relations: ['categoryLimits', 'incomePlanItems'],
    });
    
    // Ensure categoryLimits and incomePlanItems are always arrays
    if (result) {
      result.categoryLimits = result.categoryLimits || [];
      result.incomePlanItems = result.incomePlanItems || [];
    }
    
    return result;
  });
}

export async function updateBudget(budgetId: number, userId: number, dto: UpdateBudgetDto) {
  return AppDataSource.transaction(async (manager) => {
    const budget = await manager.findOne(BudgetPlan, { where: { id: budgetId, userId } });
    if (!budget) throw new ApiError('Budget not found', 404);

    // If both plan values are 0 — delete the whole budget
    if (dto.totalIncomePlan === 0 && dto.totalExpensePlan === 0) {
      await manager.delete(BudgetCategoryLimit, { budgetPlanId: budgetId });
      await manager.delete(BudgetIncomePlanItem, { budgetPlanId: budgetId });
      await manager.delete(BudgetPlan, { id: budgetId });
      return null;
    }

    Object.assign(budget, {
      monthKey: dto.monthKey ?? budget.monthKey,
      accountId: dto.accountId !== undefined && dto.accountId !== null ? String(dto.accountId) : null,
      totalIncomePlan: dto.totalIncomePlan ?? budget.totalIncomePlan,
      totalExpensePlan: dto.totalExpensePlan ?? budget.totalExpensePlan,
    });
    await manager.save(BudgetPlan, budget);

    if (dto.categoryLimits !== undefined) {
      await manager.delete(BudgetCategoryLimit, { budgetPlanId: budgetId });
      await saveCategoryLimits(budgetId, dto.categoryLimits ?? []);
    }

    if (dto.incomePlanItems !== undefined) {
      await manager.delete(BudgetIncomePlanItem, { budgetPlanId: budgetId });
      await saveIncomePlanItems(budgetId, dto.incomePlanItems ?? []);
    }

    // Return with relations using the same manager
    return manager.findOne(BudgetPlan, {
      where: { id: budgetId },
      relations: ['categoryLimits', 'incomePlanItems'],
    });
  });
}

export async function deleteBudget(budgetId: number, userId: number) {
  const budget = await budgetRepo().findOne({ where: { id: budgetId, userId } });
  if (!budget) throw new ApiError('Budget not found', 404);

  await limitRepo().delete({ budgetPlanId: budgetId });
  await incomeRepo().delete({ budgetPlanId: budgetId });
  await budgetRepo().delete({ id: budgetId });
}

export async function upsertCategoryLimit(budgetId: number, userId: number, category: string, limitAmount: number) {
  const budget = await budgetRepo().findOne({ where: { id: budgetId, userId } });
  if (!budget) throw new ApiError('Budget not found', 404);

  const existing = await limitRepo().findOne({ where: { budgetPlanId: budgetId, category } });
  if (existing) {
    existing.limit = limitAmount;
    await limitRepo().save(existing);
  } else {
    await limitRepo().save(limitRepo().create({ budgetPlanId: budgetId, category, limit: limitAmount }));
  }

  return findBudgetWithRelations(budgetId);
}

export async function deleteCategoryLimit(budgetId: number, userId: number, category: string) {
  const budget = await budgetRepo().findOne({ where: { id: budgetId, userId } });
  if (!budget) throw new ApiError('Budget not found', 404);
  await limitRepo().delete({ budgetPlanId: budgetId, category });
  return findBudgetWithRelations(budgetId);
}

export async function getBudgetSummary(userId: number, monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const transactions = await AppDataSource.getRepository(Transaction)
    .createQueryBuilder('t')
    .where('t.userId = :userId', { userId })
    .andWhere('t.date >= :startDate', { startDate })
    .andWhere('t.date <= :endDate', { endDate })
    .getMany();

  const income = transactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expensesByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === TransactionType.EXPENSE && t.category)
    .forEach((t) => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] ?? 0) + Number(t.amount);
    });

  return { totalIncome: income, totalExpenses: expenses, balance: income - expenses, expensesByCategory };
}
