import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Transaction, TransactionType } from '../entity/Transaction';
import { Account } from '../entity/Account';
import { User } from '../entity/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { IsNull } from 'typeorm';

const router = Router();
const transactionRepository = () => AppDataSource.getRepository(Transaction);
const accountRepository = () => AppDataSource.getRepository(Account);
const userRepository = () => AppDataSource.getRepository(User);

router.use(authenticate);

// Вспомогательная функция для определения условий запроса на основе workspace
async function getTransactionQueryConditions(req: AuthRequest) {
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
  
  // Для Personal workspace возвращаем только личные транзакции (familyGroupId = null)
  return { userId: req.userId, familyGroupId: IsNull() };
}

// Вспомогательная функция для получения familyGroupId
async function getFamilyGroupId(req: AuthRequest): Promise<number | null> {
  const workspace = req.body.workspace || req.query.workspace as string;
  
  if (workspace === 'family') {
    const user = await userRepository().findOne({ where: { id: req.userId } });
    return user?.familyGroupId || null;
  }
  return null;
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { startDate, endDate, type, accountId } = req.query;
    const conditions = await getTransactionQueryConditions(req);

    const query = transactionRepository().createQueryBuilder('transaction');
    
    // Добавляем условия на основе workspace
    if (conditions.familyGroupId && typeof conditions.familyGroupId === 'number') {
      query.where('transaction.familyGroupId = :familyGroupId', { familyGroupId: conditions.familyGroupId });
    } else {
      query.where('transaction.userId = :userId AND transaction.familyGroupId IS NULL', { userId: req.userId });
    }

    if (startDate) query.andWhere('transaction.date >= :startDate', { startDate });
    if (endDate) query.andWhere('transaction.date <= :endDate', { endDate });
    if (type) query.andWhere('transaction.type = :type', { type });
    // Конвертируем accountId в число, если приходит как строка
    if (accountId) {
      const numericAccountId = typeof accountId === 'string' ? parseInt(accountId, 10) : accountId;
      query.andWhere('transaction.accountId = :accountId', { accountId: numericAccountId });
    }

    const transactions = await query.orderBy('transaction.date', 'DESC').getMany();
    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { amount, description, date, type, category, accountId, toAccountId, currency, toCurrency, toAmount, accountName, toAccountName, icon, note, workspace } = req.body;

    // Конвертируем ID в числа, если они приходят как строки
    // Так как фронтенд хранит ID как строки, а бэкенд использует числа
    const numericAccountId = typeof accountId === 'string' ? parseInt(accountId, 10) : accountId;
    const numericToAccountId = typeof toAccountId === 'string' ? parseInt(toAccountId, 10) : toAccountId;

    // Определяем familyGroupId
    let familyGroupId: number | null = null;
    let accountConditions: any;
    
    if (workspace === 'family') {
      const user = await userRepository().findOne({ where: { id: req.userId } });
      familyGroupId = user?.familyGroupId || null;
      
      if (!familyGroupId) {
        // Пользователь не состоит в семейной группе
        throw new ApiError('Вы не состоите в семейной группе. Создайте или присоединитесь к семейной группе для выполнения операций в режиме Family.', 400);
      }
      
      // Для family ищем счёт по familyGroupId
      accountConditions = { id: numericAccountId, familyGroupId };
    } else {
      // Для personal ищем личный счёт (familyGroupId = null)
      accountConditions = { id: numericAccountId, userId: req.userId, familyGroupId: IsNull() };
    }
    
    const account = await accountRepository().findOne({
      where: accountConditions,
    });

    if (!account) {
      console.log('Account not found with conditions:', accountConditions);
      throw new ApiError('Account not found', 404);
    }

    const transaction = transactionRepository().create({
      amount, 
      description,
      date: new Date(date),
      type: type as TransactionType,
      category, 
      currency,
      accountId: numericAccountId, 
      accountName,
      toAccountId: numericToAccountId,
      toAccountName,
      toCurrency,
      toAmount,
      icon,
      note,
      userId: req.userId!,
      familyGroupId,
    });

    // Нормализуем тип транзакции к верхнему регистру
    const normalizedType = (type as string).toUpperCase();

    if (normalizedType === 'INCOME') {
      account.balance = Number(account.balance) + Number(amount);
    } else if (normalizedType === 'EXPENSE') {
      account.balance = Number(account.balance) - Number(amount);
    } else if (normalizedType === 'TRANSFER' && numericToAccountId) {
      account.balance = Number(account.balance) - Number(amount);
      const toAccountConditions = familyGroupId
        ? { id: numericToAccountId, familyGroupId }
        : { id: numericToAccountId, userId: req.userId, familyGroupId: IsNull() };
      const toAccount = await accountRepository().findOne({ where: toAccountConditions });
      if (toAccount) {
        toAccount.balance = Number(toAccount.balance) + Number(toAmount || amount);
        await accountRepository().save(toAccount);
      }
    }

    await accountRepository().save(account);
    await transactionRepository().save(transaction);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const transactionId = parseInt(req.params.id);
    const conditions = await getTransactionQueryConditions(req);
    
    // Находим транзакцию перед удалением
    const existingTransaction = await transactionRepository().findOne({
      where: { id: transactionId, ...conditions },
    });
    
    if (!existingTransaction) {
      throw new ApiError('Transaction not found', 404);
    }
    
    // Восстанавливаем баланс счёта при удалении транзакции
    const accountConditions = existingTransaction.familyGroupId
      ? { id: existingTransaction.accountId, familyGroupId: existingTransaction.familyGroupId }
      : { id: existingTransaction.accountId, userId: req.userId, familyGroupId: IsNull() };
    
    const account = await accountRepository().findOne({
      where: accountConditions,
    });
    
    if (account) {
      const normalizedType = (existingTransaction.type as string).toUpperCase();
      
      if (normalizedType === 'INCOME') {
        // При удалении дохода - вычитаем сумму
        account.balance = Number(account.balance) - Number(existingTransaction.amount);
      } else if (normalizedType === 'EXPENSE') {
        // При удалении расхода - возвращаем сумму
        account.balance = Number(account.balance) + Number(existingTransaction.amount);
      } else if (normalizedType === 'TRANSFER' && existingTransaction.toAccountId) {
        // При удалении перевода - возвращаем сумму на исходный счёт
        account.balance = Number(account.balance) + Number(existingTransaction.amount);
        
        // И вычитаем из целевого счёта
        const toAccountConditions = existingTransaction.familyGroupId
          ? { id: existingTransaction.toAccountId, familyGroupId: existingTransaction.familyGroupId }
          : { id: existingTransaction.toAccountId, userId: req.userId, familyGroupId: IsNull() };
        const toAccount = await accountRepository().findOne({
          where: toAccountConditions,
        });
        if (toAccount) {
          toAccount.balance = Number(toAccount.balance) - Number(existingTransaction.toAmount || existingTransaction.amount);
          await accountRepository().save(toAccount);
        }
      }
      
      await accountRepository().save(account);
    }
    
    const result = await transactionRepository().delete({
      id: transactionId,
      ...conditions,
    });

    if (result.affected === 0) throw new ApiError('Transaction not found', 404);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    next(error);
  }
});

// Обновить транзакцию
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { amount, description, date, type, category, accountId, toAccountId, currency, toCurrency, toAmount, accountName, toAccountName, icon, note } = req.body;
    const transactionId = parseInt(req.params.id);

    // Конвертируем ID в числа, если они приходят как строки
    const numericAccountId = typeof accountId === 'string' ? parseInt(accountId, 10) : accountId;
    const numericToAccountId = typeof toAccountId === 'string' ? parseInt(toAccountId, 10) : toAccountId;

    // Находим существующую транзакцию
    const existingTransaction = await transactionRepository().findOne({
      where: { id: transactionId },
    });

    if (!existingTransaction) {
      throw new ApiError('Transaction not found', 404);
    }

    // Проверяем доступ к транзакции
    if (existingTransaction.familyGroupId) {
      const user = await userRepository().findOne({ where: { id: req.userId } });
      if (user?.familyGroupId !== existingTransaction.familyGroupId) {
        throw new ApiError('Transaction not found', 404);
      }
    } else if (existingTransaction.userId !== req.userId) {
      throw new ApiError('Transaction not found', 404);
    }

    // Находим старый и новый счета
    const oldAccountConditions = existingTransaction.familyGroupId
      ? { id: existingTransaction.accountId, familyGroupId: existingTransaction.familyGroupId }
      : { id: existingTransaction.accountId, userId: req.userId, familyGroupId: IsNull() };
    
    const oldAccount = await accountRepository().findOne({
      where: oldAccountConditions,
    });

    const newAccountConditions = existingTransaction.familyGroupId
      ? { id: numericAccountId, familyGroupId: existingTransaction.familyGroupId }
      : { id: numericAccountId, userId: req.userId, familyGroupId: IsNull() };
    
    const newAccount = await accountRepository().findOne({
      where: newAccountConditions,
    });

    if (!newAccount) {
      throw new ApiError('Account not found', 404);
    }

    const normalizedOldType = (existingTransaction.type as string).toUpperCase();
    const normalizedNewType = (type as string).toUpperCase();
    const sameAccount = existingTransaction.accountId === numericAccountId;

    // Логика обновления баланса:
    // 1. Если счёт тот же - просто применяем разницу между старой и новой суммой
    // 2. Если счёт изменился - восстанавливаем старый счёт и обновляем новый
    
    if (sameAccount) {
      // Счёт не изменился - вычисляем разницу
      let balanceDiff = 0;
      
      // Сначала убираем влияние старой транзакции
      if (normalizedOldType === 'INCOME') {
        balanceDiff -= Number(existingTransaction.amount);
      } else if (normalizedOldType === 'EXPENSE') {
        balanceDiff += Number(existingTransaction.amount);
      } else if (normalizedOldType === 'TRANSFER' && existingTransaction.toAccountId) {
        balanceDiff += Number(existingTransaction.amount);
        // Также восстанавливаем баланс целевого счёта при переводе
        const oldToAccountConditions = existingTransaction.familyGroupId
          ? { id: existingTransaction.toAccountId, familyGroupId: existingTransaction.familyGroupId }
          : { id: existingTransaction.toAccountId, userId: req.userId, familyGroupId: IsNull() };
        const oldToAccount = await accountRepository().findOne({
          where: oldToAccountConditions,
        });
        if (oldToAccount) {
          oldToAccount.balance = Number(oldToAccount.balance) - Number(existingTransaction.toAmount || existingTransaction.amount);
          await accountRepository().save(oldToAccount);
        }
      }
      
      // Затем применяем влияние новой транзакции
      if (normalizedNewType === 'INCOME') {
        balanceDiff += Number(amount);
      } else if (normalizedNewType === 'EXPENSE') {
        balanceDiff -= Number(amount);
      } else if (normalizedNewType === 'TRANSFER' && numericToAccountId) {
        balanceDiff -= Number(amount);
        // Обновляем баланс целевого счёта при переводе
        const newToAccountConditions = existingTransaction.familyGroupId
          ? { id: numericToAccountId, familyGroupId: existingTransaction.familyGroupId }
          : { id: numericToAccountId, userId: req.userId, familyGroupId: IsNull() };
        const newToAccount = await accountRepository().findOne({
          where: newToAccountConditions,
        });
        if (newToAccount) {
          newToAccount.balance = Number(newToAccount.balance) + Number(toAmount || amount);
          await accountRepository().save(newToAccount);
        }
      }
      
      newAccount.balance = Number(newAccount.balance) + balanceDiff;
      await accountRepository().save(newAccount);
    } else {
      // Счёт изменился - восстанавливаем старый счёт
      if (oldAccount) {
        if (normalizedOldType === 'INCOME') {
          oldAccount.balance = Number(oldAccount.balance) - Number(existingTransaction.amount);
        } else if (normalizedOldType === 'EXPENSE') {
          oldAccount.balance = Number(oldAccount.balance) + Number(existingTransaction.amount);
        } else if (normalizedOldType === 'TRANSFER' && existingTransaction.toAccountId) {
          oldAccount.balance = Number(oldAccount.balance) + Number(existingTransaction.amount);
          const oldToAccountConditions = existingTransaction.familyGroupId
            ? { id: existingTransaction.toAccountId, familyGroupId: existingTransaction.familyGroupId }
            : { id: existingTransaction.toAccountId, userId: req.userId, familyGroupId: IsNull() };
          const oldToAccount = await accountRepository().findOne({
            where: oldToAccountConditions,
          });
          if (oldToAccount) {
            oldToAccount.balance = Number(oldToAccount.balance) - Number(existingTransaction.toAmount || existingTransaction.amount);
            await accountRepository().save(oldToAccount);
          }
        }
        await accountRepository().save(oldAccount);
      }

      // Обновляем баланс нового счёта
      if (normalizedNewType === 'INCOME') {
        newAccount.balance = Number(newAccount.balance) + Number(amount);
      } else if (normalizedNewType === 'EXPENSE') {
        newAccount.balance = Number(newAccount.balance) - Number(amount);
      } else if (normalizedNewType === 'TRANSFER' && numericToAccountId) {
        newAccount.balance = Number(newAccount.balance) - Number(amount);
        const toAccountConditions = existingTransaction.familyGroupId
          ? { id: numericToAccountId, familyGroupId: existingTransaction.familyGroupId }
          : { id: numericToAccountId, userId: req.userId, familyGroupId: IsNull() };
        const toAccount = await accountRepository().findOne({
          where: toAccountConditions,
        });
        if (toAccount) {
          toAccount.balance = Number(toAccount.balance) + Number(toAmount || amount);
          await accountRepository().save(toAccount);
        }
      }

      await accountRepository().save(newAccount);
    }

    // Обновляем транзакцию
    Object.assign(existingTransaction, {
      amount,
      description,
      date: new Date(date),
      type: type as TransactionType,
      category,
      currency,
      accountId: numericAccountId,
      accountName,
      toAccountId: numericToAccountId,
      toAccountName,
      toCurrency,
      toAmount,
      icon,
      note,
    });

    await transactionRepository().save(existingTransaction);
    res.json({ success: true, data: existingTransaction });
  } catch (error) {
    next(error);
  }
});

export default router;
