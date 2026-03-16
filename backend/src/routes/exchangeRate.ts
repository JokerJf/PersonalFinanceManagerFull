import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { ExchangeRate } from '../entity/ExchangeRate';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const exchangeRateRepository = AppDataSource.getRepository(ExchangeRate);
    const rates = await exchangeRateRepository.find();
    res.json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
});

// Получить список доступных валют
router.get('/currencies', async (req: AuthRequest, res, next) => {
  try {
    const exchangeRateRepository = AppDataSource.getRepository(ExchangeRate);
    const rates = await exchangeRateRepository.find();
    
    // Собираем все уникальные валюты только из базы данных
    const currencies = new Set<string>();
    rates.forEach(rate => {
      currencies.add(rate.fromCurrency);
      currencies.add(rate.toCurrency);
    });
    
    // Если в базе данных нет валют, возвращаем пустой массив
    // (фронтенд сам решит какие валюты показать по умолчанию)
    res.json({ success: true, data: Array.from(currencies).sort() });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { fromCurrency, toCurrency, rate } = req.body;
    const exchangeRateRepository = AppDataSource.getRepository(ExchangeRate);

    const existingRate = await exchangeRateRepository.findOne({ where: { fromCurrency, toCurrency } });
    if (existingRate) {
      existingRate.rate = rate;
      await exchangeRateRepository.save(existingRate);
      return res.json({ success: true, data: existingRate });
    }

    const newRate = exchangeRateRepository.create({ fromCurrency, toCurrency, rate });
    await exchangeRateRepository.save(newRate);
    res.status(201).json({ success: true, data: newRate });
  } catch (error) {
    next(error);
  }
});

router.get('/convert', async (req: AuthRequest, res, next) => {
  try {
    const { from, to, amount } = req.query;
    const exchangeRateRepository = AppDataSource.getRepository(ExchangeRate);
    const rate = await exchangeRateRepository.findOne({ where: { fromCurrency: from as string, toCurrency: to as string } });

    if (!rate) return res.status(404).json({ success: false, message: 'Exchange rate not found' });
    const convertedAmount = Number(amount) * Number(rate.rate);
    res.json({ success: true, data: { convertedAmount } });
  } catch (error) {
    next(error);
  }
});

export default router;
