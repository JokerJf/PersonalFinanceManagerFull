import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Account } from '../entity/Account';
import { Transaction } from '../entity/Transaction';
import { User } from '../entity/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { FindOptionsWhere, IsNull } from 'typeorm';

const router = Router();
const accountRepository = () => AppDataSource.getRepository(Account);
const transactionRepository = () => AppDataSource.getRepository(Transaction);
const userRepository = () => AppDataSource.getRepository(User);

router.use(authenticate);

// Вспомогательная функция для определения условий запроса на основе workspace
async function getAccountQueryConditions(req: AuthRequest): Promise<FindOptionsWhere<Account> | FindOptionsWhere<Account>[]> {
  const workspace = req.query.workspace as string || 'personal';
  
  if (workspace === 'family') {
    // Для Family workspace нужно получить familyGroupId пользователя
    const user = await userRepository().findOne({ where: { id: req.userId } });
    
    if (user && user.familyGroupId) {
      return { familyGroupId: user.familyGroupId };
    }
    // Если пользователь не в семейной группе, возвращаем условие, которое не найдёт записей
    return { familyGroupId: -1 };
  }
  
  // Для Personal workspace возвращаем только личные счета (familyGroupId = null)
  return { userId: req.userId, familyGroupId: IsNull() };
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const conditions = await getAccountQueryConditions(req);
    const accounts = await accountRepository().find({
      where: conditions,
      order: { createdAt: 'DESC' },
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
});

// Получить уникальные валюты из счетов пользователя
router.get('/currencies', async (req: AuthRequest, res, next) => {
  try {
    const conditions = await getAccountQueryConditions(req);
    const accounts = await accountRepository().find({
      where: conditions,
      select: ['currency'],
    });
    
    // Получаем уникальные валюты
    const currencies = [...new Set(accounts.map(a => a.currency))].sort();
    
    res.json({ success: true, data: currencies });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { name, balance, type, cardNumber, cardNumberFull, expiryDate, cardNetwork, colorStyle, currency, includedInBalance, workspace } = req.body;
    
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

    const account = accountRepository().create({
      name,
      balance: balance || 0,
      type: type || 'CASH',
      cardNumber,
      cardNumberFull,
      expiryDate,
      cardNetwork,
      colorStyle: colorStyle || 1,
      currency: currency || 'UZS',
      includedInBalance: includedInBalance !== false,
      userId: req.userId!,
      familyGroupId,
    });

    await accountRepository().save(account);
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const conditions = await getAccountQueryConditions(req);
    const account = await accountRepository().findOne({
      where: { id: parseInt(req.params.id), ...conditions } as FindOptionsWhere<Account>,
    });

    if (!account) {
      throw new ApiError('Account not found', 404);
    }

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const conditions = await getAccountQueryConditions(req);
    const account = await accountRepository().findOne({
      where: { id: parseInt(req.params.id), ...conditions } as FindOptionsWhere<Account>,
    });

    if (!account) {
      throw new ApiError('Account not found', 404);
    }

    const { name, balance, type, cardNumber, cardNumberFull, expiryDate, cardNetwork, colorStyle, currency, includedInBalance, isActive } = req.body;

    Object.assign(account, {
      name,
      balance,
      type,
      cardNumber,
      cardNumberFull,
      expiryDate,
      cardNetwork,
      colorStyle,
      currency,
      includedInBalance,
      isActive,
    });
    
    await accountRepository().save(account);

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const accountId = parseInt(req.params.id);
    const conditions = await getAccountQueryConditions(req);
    
    // Проверяем, существует ли аккаунт
    const account = await accountRepository().findOne({
      where: { id: accountId, ...conditions } as FindOptionsWhere<Account>,
    });

    if (!account) {
      throw new ApiError('Account not found', 404);
    }
    
    // Удаляем связанные транзакции, где этот счёт является source (accountId)
    await transactionRepository().delete({
      accountId: accountId,
    });
    
    // Удаляем связанные транзакции, где этот счёт является назначением (toAccountId)
    await transactionRepository().delete({
      toAccountId: accountId,
    });

    // Теперь удаляем аккаунт
    const result = await accountRepository().delete({
      id: accountId,
      ...conditions,
    } as FindOptionsWhere<Account>);

    if (result.affected === 0) {
      throw new ApiError('Account not found', 404);
    }

    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
