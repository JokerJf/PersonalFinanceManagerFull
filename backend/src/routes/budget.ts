import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { BudgetPlan } from '../entity/BudgetPlan';
import { BudgetCategoryLimit } from '../entity/BudgetCategoryLimit';
import { BudgetIncomePlanItem } from '../entity/BudgetIncomePlanItem';
import { Transaction, TransactionType } from '../entity/Transaction';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { accountId } = req.query;
    const budgetRepository = AppDataSource.getRepository(BudgetPlan);
    
    const whereCondition: any = { userId: req.userId };
    if (accountId) {
      whereCondition.accountId = accountId as string;
    }
    
    const budgets = await budgetRepository.find({
      where: whereCondition,
      relations: ['categoryLimits', 'incomePlanItems'],
      order: { monthKey: 'DESC' },
    });
    res.json({ success: true, data: budgets });
  } catch (error) {
    next(error);
  }
});

// Получить бюджет по monthKey и accountId
router.get('/by-month', async (req: AuthRequest, res, next) => {
  try {
    const { monthKey, accountId } = req.query;
    
    if (!monthKey) {
      return res.status(400).json({ success: false, message: 'monthKey is required' });
    }
    
    const budgetRepository = AppDataSource.getRepository(BudgetPlan);
    
    const whereCondition: any = { 
      userId: req.userId,
      monthKey: monthKey as string
    };
    
    if (accountId) {
      whereCondition.accountId = accountId as string;
    }
    
    const budget = await budgetRepository.findOne({
      where: whereCondition,
      relations: ['categoryLimits', 'incomePlanItems'],
    });
    
    res.json({ success: true, data: budget || null });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { monthKey, accountId, totalIncomePlan, totalExpensePlan, categoryLimits, incomePlanItems } = req.body;

    const budgetRepository = AppDataSource.getRepository(BudgetPlan);
    const limitRepository = AppDataSource.getRepository(BudgetCategoryLimit);
    const incomeRepository = AppDataSource.getRepository(BudgetIncomePlanItem);

    const budget = budgetRepository.create({
      monthKey,
      accountId: accountId || null,
      totalIncomePlan: totalIncomePlan || 0,
      totalExpensePlan: totalExpensePlan || 0,
      userId: req.userId!,
    });

    const savedBudget = await budgetRepository.save(budget);

    if (categoryLimits?.length) {
      const limits = categoryLimits.map((limit: any) => limitRepository.create({ ...limit, budgetPlanId: savedBudget.id }));
      await limitRepository.save(limits);
    }

    if (incomePlanItems?.length) {
      const incomes = incomePlanItems.map((item: any) => incomeRepository.create({ ...item, budgetPlanId: savedBudget.id }));
      await incomeRepository.save(incomes);
    }

    const result = await budgetRepository.findOne({
      where: { id: savedBudget.id },
      relations: ['categoryLimits', 'incomePlanItems'],
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/summary/:monthKey', async (req: AuthRequest, res, next) => {
  try {
    const { monthKey } = req.params;
    const [year, month] = monthKey.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const transactionRepository = AppDataSource.getRepository(Transaction);
    const transactions = await transactionRepository
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId: req.userId })
      .andWhere('t.date >= :startDate', { startDate })
      .andWhere('t.date <= :endDate', { endDate })
      .getMany();

    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + Number(t.amount), 0);

    const expensesByCategory: Record<string, number> = {};
    transactions.filter(t => t.type === TransactionType.EXPENSE && t.category).forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount);
    });

    res.json({ success: true, data: { totalIncome: income, totalExpenses: expenses, balance: income - expenses, expensesByCategory } });
  } catch (error) {
    next(error);
  }
});

// Обновить бюджет
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const budgetId = parseInt(req.params.id);
    const { monthKey, accountId, totalIncomePlan, totalExpensePlan, categoryLimits, incomePlanItems } = req.body;

    const budgetRepository = AppDataSource.getRepository(BudgetPlan);
    const limitRepository = AppDataSource.getRepository(BudgetCategoryLimit);
    const incomeRepository = AppDataSource.getRepository(BudgetIncomePlanItem);

    // Проверяем, существует ли бюджет
    const existingBudget = await budgetRepository.findOne({
      where: { id: budgetId, userId: req.userId }
    });

    if (!existingBudget) {
      throw new ApiError('Budget not found', 404);
    }

    // Если оба значения 0, удаляем бюджет
    if (totalIncomePlan === 0 && totalExpensePlan === 0) {
      // Удаляем связанные лимиты и доходы
      await limitRepository.delete({ budgetPlanId: budgetId });
      await incomeRepository.delete({ budgetPlanId: budgetId });
      // Удаляем сам бюджет
      await budgetRepository.delete({ id: budgetId });
      
      res.json({ success: true, message: 'Budget deleted' });
      return;
    }

    // Обновляем бюджет
    Object.assign(existingBudget, {
      monthKey,
      accountId: accountId || null,
      totalIncomePlan: totalIncomePlan || 0,
      totalExpensePlan: totalExpensePlan || 0,
    });

    await budgetRepository.save(existingBudget);

    // Обновляем лимиты категорий
    if (categoryLimits !== undefined) {
      // Удаляем старые лимиты
      await limitRepository.delete({ budgetPlanId: budgetId });
      
      // Создаём новые лимиты (только если есть данные)
      if (categoryLimits.length > 0) {
        const limits = categoryLimits.map((limit: any) => 
          limitRepository.create({ 
            budgetPlanId: existingBudget.id, 
            category: limit.category, 
            limit: limit.limitAmount || 0 
          })
        );
        await limitRepository.save(limits);
      }
    }

    // Обновляем статьи дохода
    if (incomePlanItems !== undefined) {
      // Удаляем старые статьи дохода
      await incomeRepository.delete({ budgetPlanId: budgetId });
      
      // Создаём новые статьи дохода (только если есть данные)
      if (incomePlanItems.length > 0) {
        const incomes = incomePlanItems.map((item: any) => 
          incomeRepository.create({ 
            budgetPlanId: existingBudget.id, 
            category: item.category, 
            plannedAmount: item.plannedAmount || 0 
          })
        );
        await incomeRepository.save(incomes);
      }
    }

    const result = await budgetRepository.findOne({
      where: { id: existingBudget.id },
      relations: ['categoryLimits', 'incomePlanItems'],
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Добавить лимит категории
router.post('/:id/category-limits', async (req: AuthRequest, res, next) => {
  try {
    const budgetId = parseInt(req.params.id);
    const { category, limitAmount } = req.body;

    const budgetRepository = AppDataSource.getRepository(BudgetPlan);
    const limitRepository = AppDataSource.getRepository(BudgetCategoryLimit);

    // Проверяем, существует ли бюджет
    const existingBudget = await budgetRepository.findOne({
      where: { id: budgetId, userId: req.userId }
    });

    if (!existingBudget) {
      throw new ApiError('Budget not found', 404);
    }

    // Проверяем, существует ли уже лимит для этой категории
    const existingLimit = await limitRepository.findOne({
      where: { budgetPlanId: budgetId, category }
    });

    if (existingLimit) {
      // Обновляем существующий лимит
      existingLimit.limit = limitAmount || 0;
      await limitRepository.save(existingLimit);
      
      const result = await budgetRepository.findOne({
        where: { id: budgetId },
        relations: ['categoryLimits', 'incomePlanItems'],
      });
      
      res.json({ success: true, data: result });
    } else {
      // Создаём новый лимит
      const newLimit = limitRepository.create({
        budgetPlanId: budgetId,
        category,
        limit: limitAmount || 0
      });
      
      await limitRepository.save(newLimit);
      
      const result = await budgetRepository.findOne({
        where: { id: budgetId },
        relations: ['categoryLimits', 'incomePlanItems'],
      });
      
      res.json({ success: true, data: result });
    }
  } catch (error) {
    next(error);
  }
});

// Удалить лимит категории
router.delete('/:id/category-limits/:category', async (req: AuthRequest, res, next) => {
  try {
    const budgetId = parseInt(req.params.id);
    const { category } = req.params;

    const budgetRepository = AppDataSource.getRepository(BudgetPlan);
    const limitRepository = AppDataSource.getRepository(BudgetCategoryLimit);

    // Проверяем, существует ли бюджет
    const existingBudget = await budgetRepository.findOne({
      where: { id: budgetId, userId: req.userId }
    });

    if (!existingBudget) {
      throw new ApiError('Budget not found', 404);
    }

    // Удаляем лимит
    await limitRepository.delete({ budgetPlanId: budgetId, category });
    
    const result = await budgetRepository.findOne({
      where: { id: budgetId },
      relations: ['categoryLimits', 'incomePlanItems'],
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Обновить лимит категории
router.put('/:id/category-limits/:category', async (req: AuthRequest, res, next) => {
  try {
    const budgetId = parseInt(req.params.id);
    const { category } = req.params;
    const { limitAmount } = req.body;

    const budgetRepository = AppDataSource.getRepository(BudgetPlan);
    const limitRepository = AppDataSource.getRepository(BudgetCategoryLimit);

    // Проверяем, существует ли бюджет
    const existingBudget = await budgetRepository.findOne({
      where: { id: budgetId, userId: req.userId }
    });

    if (!existingBudget) {
      throw new ApiError('Budget not found', 404);
    }

    // Находим лимит
    const existingLimit = await limitRepository.findOne({
      where: { budgetPlanId: budgetId, category }
    });

    if (!existingLimit) {
      throw new ApiError('Category limit not found', 404);
    }

    // Обновляем лимит
    existingLimit.limit = limitAmount || 0;
    await limitRepository.save(existingLimit);
    
    const result = await budgetRepository.findOne({
      where: { id: budgetId },
      relations: ['categoryLimits', 'incomePlanItems'],
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Удалить бюджет
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const budgetId = parseInt(req.params.id);
    
    const budgetRepository = AppDataSource.getRepository(BudgetPlan);
    const limitRepository = AppDataSource.getRepository(BudgetCategoryLimit);
    const incomeRepository = AppDataSource.getRepository(BudgetIncomePlanItem);

    // Проверяем, существует ли бюджет
    const existingBudget = await budgetRepository.findOne({
      where: { id: budgetId, userId: req.userId }
    });

    if (!existingBudget) {
      throw new ApiError('Budget not found', 404);
    }

    // Удаляем связанные лимиты и доходы
    await limitRepository.delete({ budgetPlanId: budgetId });
    await incomeRepository.delete({ budgetPlanId: budgetId });

    // Удаляем бюджет
    await budgetRepository.delete({ id: budgetId });

    res.json({ success: true, message: 'Budget deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
