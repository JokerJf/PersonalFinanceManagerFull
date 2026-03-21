import { AppDataSource } from '../config/database';
import { ExchangeRate } from '../entity/ExchangeRate';
import { logger } from './logger';

const INITIAL_RATES = [
  { fromCurrency: 'USD', toCurrency: 'UZS', rate: 12400 },
  { fromCurrency: 'EUR', toCurrency: 'UZS', rate: 13200 },
  { fromCurrency: 'RUB', toCurrency: 'UZS', rate: 135 },
  { fromCurrency: 'UZS', toCurrency: 'USD', rate: 0.0000806 },
  { fromCurrency: 'UZS', toCurrency: 'EUR', rate: 0.0000757 },
  { fromCurrency: 'UZS', toCurrency: 'RUB', rate: 0.00741 },
  { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
  { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.09 },
  { fromCurrency: 'USD', toCurrency: 'RUB', rate: 92.5 },
  { fromCurrency: 'RUB', toCurrency: 'USD', rate: 0.0108 },
  { fromCurrency: 'EUR', toCurrency: 'RUB', rate: 100.5 },
  { fromCurrency: 'RUB', toCurrency: 'EUR', rate: 0.00995 },
];

export const initExchangeRates = async (): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(ExchangeRate);
    const count = await repo.count();
    if (count > 0) {
      logger.info('Exchange rates already initialised, skipping');
      return;
    }
    await repo.save(INITIAL_RATES.map((r) => repo.create(r)));
    logger.info(`Initialised ${INITIAL_RATES.length} exchange rates`);
  } catch (error) {
    logger.error('Failed to initialise exchange rates', { error });
  }
};
