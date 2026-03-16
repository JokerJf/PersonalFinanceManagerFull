import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Transaction, TransactionType } from '../entity/Transaction';
import { Account } from '../entity/Account';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const query = transactionRepository.createQueryBuilder('transaction').where('transaction.userId = :userId', { userId: req.userId });
    if (startDate) query.andWhere('transaction.date >= :startDate', { startDate });
    if (endDate) query.andWhere('transaction.date <= :endDate', { endDate });

    const transactions = await query.getMany();

    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + Number(t.amount), 0);

    res.json({ success: true, data: { totalIncome: income, totalExpenses: expenses, balance: income - expenses } });
  } catch (error) {
    next(error);
  }
});

router.get('/by-category', async (req: AuthRequest, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const query = transactionRepository.createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId: req.userId })
      .andWhere('transaction.type = :type', { type: TransactionType.EXPENSE });

    if (startDate) query.andWhere('transaction.date >= :startDate', { startDate });
    if (endDate) query.andWhere('transaction.date <= :endDate', { endDate });

    const transactions = await query.getMany();

    const byCategory: Record<string, number> = {};
    transactions.forEach(t => {
      const category = t.category || 'Other';
      byCategory[category] = (byCategory[category] || 0) + Number(t.amount);
    });

    res.json({ success: true, data: byCategory });
  } catch (error) {
    next(error);
  }
});

router.get('/accounts-summary', async (req: AuthRequest, res, next) => {
  try {
    const accountRepository = AppDataSource.getRepository(Account);
    const accounts = await accountRepository.find({ where: { userId: req.userId, isActive: true } });
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    res.json({ success: true, data: { totalBalance, accounts } });
  } catch (error) {
    next(error);
  }
});

export default router;
