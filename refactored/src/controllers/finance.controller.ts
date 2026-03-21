import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as AccountService from '../services/account.service';
import * as TransactionService from '../services/transaction.service';
import * as BudgetService from '../services/budget.service';
import * as FinanceService from '../services/finance.service';
import { Workspace } from '../types';

function workspace(req: AuthRequest): Workspace {
  return (req.query.workspace as Workspace) ?? 'personal';
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function listAccounts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AccountService.listAccounts(req.userId!, workspace(req));
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function listAccountCurrencies(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AccountService.listAccountCurrencies(req.userId!, workspace(req));
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AccountService.getAccount(parseInt(req.params.id), req.userId!, workspace(req));
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function createAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AccountService.createAccount(req.userId!, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function updateAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await AccountService.updateAccount(parseInt(req.params.id), req.userId!, workspace(req), req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await AccountService.deleteAccount(parseInt(req.params.id), req.userId!, workspace(req));
    res.json({ success: true, message: 'Account deleted' });
  } catch (e) { next(e); }
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function listTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await TransactionService.listTransactions(req.userId!, req.query as any);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function createTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await TransactionService.createTransaction(req.userId!, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function updateTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await TransactionService.updateTransaction(parseInt(req.params.id), req.userId!, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function deleteTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await TransactionService.deleteTransaction(parseInt(req.params.id), req.userId!, workspace(req));
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (e) { next(e); }
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export async function listBudgets(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await BudgetService.listBudgets(req.userId!, req.query.accountId as string | undefined);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getBudgetByMonth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { monthKey, accountId } = req.query as { monthKey: string; accountId?: string };
    const data = await BudgetService.getBudgetByMonth(req.userId!, monthKey, accountId);
    res.json({ success: true, data: data ?? null });
  } catch (e) { next(e); }
}

export async function createBudget(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await BudgetService.createBudget(req.userId!, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function updateBudget(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await BudgetService.updateBudget(parseInt(req.params.id), req.userId!, req.body);
    if (!data) { res.json({ success: true, message: 'Budget deleted' }); return; }
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function deleteBudget(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await BudgetService.deleteBudget(parseInt(req.params.id), req.userId!);
    res.json({ success: true, message: 'Budget deleted' });
  } catch (e) { next(e); }
}

export async function upsertCategoryLimit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { category, limitAmount } = req.body;
    const data = await BudgetService.upsertCategoryLimit(parseInt(req.params.id), req.userId!, category, limitAmount);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function deleteCategoryLimit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await BudgetService.deleteCategoryLimit(parseInt(req.params.id), req.userId!, req.params.category);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getBudgetSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await BudgetService.getBudgetSummary(req.userId!, req.params.monthKey);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

// ─── Debts ────────────────────────────────────────────────────────────────────

export async function listDebts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.listDebts(req.userId!, workspace(req));
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function createDebt(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.createDebt(req.userId!, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function updateDebt(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.updateDebt(parseInt(req.params.id), req.userId!, workspace(req), req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function deleteDebt(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await FinanceService.deleteDebt(parseInt(req.params.id), req.userId!, workspace(req));
    res.json({ success: true, message: 'Debt deleted' });
  } catch (e) { next(e); }
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export async function listCredits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.listCredits(req.userId!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function createCredit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.createCredit(req.userId!, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
}

export async function updateCredit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.updateCredit(parseInt(req.params.id), req.userId!, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function deleteCredit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await FinanceService.deleteCredit(parseInt(req.params.id), req.userId!);
    res.json({ success: true, message: 'Credit deleted' });
  } catch (e) { next(e); }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalyticsSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const data = await FinanceService.getAnalyticsSummary(req.userId!, startDate, endDate);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getAnalyticsByCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const data = await FinanceService.getAnalyticsByCategory(req.userId!, startDate, endDate);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getAccountsSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.getAccountsSummary(req.userId!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function listNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.listNotifications(req.userId!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.markNotificationRead(parseInt(req.params.id), req.userId!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function createNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await FinanceService.createNotification(req.userId!, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await FinanceService.deleteNotification(parseInt(req.params.id), req.userId!);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (e) { next(e); }
}
