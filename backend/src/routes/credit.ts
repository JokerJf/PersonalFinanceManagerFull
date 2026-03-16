import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Credit } from '../entity/Credit';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// Получить все кредиты
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const creditRepository = AppDataSource.getRepository(Credit);
    const credits = await creditRepository.find({ where: { userId: req.userId }, order: { createdAt: 'DESC' } });
    res.json({ success: true, data: credits });
  } catch (error) {
    next(error);
  }
});

// Создать новый кредит
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { name, totalAmount, currency, kind, startDate, endDate, months, paidAmount, paidInstallments, status, notes } = req.body;
    const creditRepository = AppDataSource.getRepository(Credit);
    
    const credit = creditRepository.create({
      name,
      totalAmount,
      currency: currency || 'USD',
      kind: kind || 'credit',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      months: months || 1,
      paidAmount: paidAmount || 0,
      paidInstallments: paidInstallments || 0,
      status: status || 'active',
      notes,
      userId: req.userId!
    });
    
    await creditRepository.save(credit);
    res.status(201).json({ success: true, data: credit });
  } catch (error) {
    next(error);
  }
});

// Обновить кредит
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const creditRepository = AppDataSource.getRepository(Credit);
    const credit = await creditRepository.findOne({ where: { id: parseInt(req.params.id), userId: req.userId } });
    if (!credit) throw new ApiError('Credit not found', 404);
    
    const { name, totalAmount, currency, kind, startDate, endDate, months, paidAmount, paidInstallments, status, notes } = req.body;
    
    if (name !== undefined) credit.name = name;
    if (totalAmount !== undefined) credit.totalAmount = totalAmount;
    if (currency !== undefined) credit.currency = currency;
    if (kind !== undefined) credit.kind = kind;
    if (startDate !== undefined) credit.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) credit.endDate = endDate ? new Date(endDate) : null;
    if (months !== undefined) credit.months = months;
    if (paidAmount !== undefined) credit.paidAmount = paidAmount;
    if (paidInstallments !== undefined) credit.paidInstallments = paidInstallments;
    if (status !== undefined) credit.status = status;
    if (notes !== undefined) credit.notes = notes;
    
    await creditRepository.save(credit);
    res.json({ success: true, data: credit });
  } catch (error) {
    next(error);
  }
});

// Удалить кредит
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const creditRepository = AppDataSource.getRepository(Credit);
    const result = await creditRepository.delete({ id: parseInt(req.params.id), userId: req.userId });
    if (result.affected === 0) throw new ApiError('Credit not found', 404);
    res.json({ success: true, message: 'Credit deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
