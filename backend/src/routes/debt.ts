import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Debt } from '../entity/Debt';
import { User } from '../entity/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { FindOptionsWhere, IsNull } from 'typeorm';

const router = Router();
const debtRepository = () => AppDataSource.getRepository(Debt);
const userRepository = () => AppDataSource.getRepository(User);

router.use(authenticate);

// Вспомогательная функция для определения условий запроса на основе workspace
async function getDebtQueryConditions(req: AuthRequest): Promise<FindOptionsWhere<Debt>> {
  const workspace = req.query.workspace as string || 'personal';
  
  if (workspace === 'family') {
    // Для Family workspace нужно получить familyGroupId пользователя
    const user = await userRepository().findOne({ where: { id: req.userId } });
    
    if (user && user.familyGroupId) {
      return { familyGroupId: user.familyGroupId };
    }
    // Если пользователь не в семейной группе
    return { familyGroupId: -1 };
  }
  
  // Для Personal workspace возвращаем только личные долги (familyGroupId = null)
  return { userId: req.userId, familyGroupId: IsNull() };
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const conditions = await getDebtQueryConditions(req);
    const debts = await debtRepository().find({ where: conditions, order: { createdAt: 'DESC' } });
    res.json({ success: true, data: debts });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { name, amount, creditor, dueDate, notes, currency, type, status, date, workspace } = req.body;
    
    // Определяем familyGroupId на основе workspace
    let familyGroupId: number | null = null;
    if (workspace === 'family') {
      const user = await userRepository().findOne({ where: { id: req.userId } });
      familyGroupId = user?.familyGroupId || null;
      
      if (!familyGroupId) {
        // Пользователь не состоит в семейной группе
        throw new ApiError('Вы не состоите в семейной группе. Создайте или присоединитесь к семейной группе для выполнения операций в режиме Family.', 400);
      }
    }

    const debtRepository = AppDataSource.getRepository(Debt);
    const debt = debtRepository.create({ 
      name, 
      amount, 
      creditor, 
      dueDate: dueDate ? new Date(dueDate) : undefined, 
      notes, 
      currency: currency || 'USD',
      type: type || 'owe',
      status: status || 'open',
      date: date ? new Date(date) : new Date(),
      userId: req.userId!,
      familyGroupId
    });
    await debtRepository.save(debt);
    res.status(201).json({ success: true, data: debt });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const conditions = await getDebtQueryConditions(req);
    const debt = await debtRepository().findOne({ where: { id: parseInt(req.params.id), ...conditions } as FindOptionsWhere<Debt> });
    if (!debt) throw new ApiError('Debt not found', 404);
    
    const { name, amount, creditor, dueDate, notes, currency, type, status, date, paidAmount } = req.body;
    
    if (name !== undefined) debt.name = name;
    if (amount !== undefined) debt.amount = amount;
    if (creditor !== undefined) debt.creditor = creditor;
    if (dueDate !== undefined) debt.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) debt.notes = notes;
    if (currency !== undefined) debt.currency = currency;
    if (type !== undefined) debt.type = type;
    if (status !== undefined) {
      debt.status = status;
      debt.isPaid = status === 'closed';
    }
    if (date !== undefined) debt.date = new Date(date);
    if (paidAmount !== undefined) debt.paidAmount = paidAmount;
    
    await debtRepository().save(debt);
    res.json({ success: true, data: debt });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const conditions = await getDebtQueryConditions(req);
    const result = await debtRepository().delete({ id: parseInt(req.params.id), ...conditions } as FindOptionsWhere<Debt>);
    if (result.affected === 0) throw new ApiError('Debt not found', 404);
    res.json({ success: true, message: 'Debt deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
