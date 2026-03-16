import { AppDataSource } from '../config/database';
import { ExchangeRate } from '../entity/ExchangeRate';

// Начальные курсы валют
const INITIAL_EXCHANGE_RATES = [
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
    const exchangeRateRepository = AppDataSource.getRepository(ExchangeRate);
    
    // Проверяем, есть ли уже курсы валют
    const existingRates = await exchangeRateRepository.count();
    if (existingRates > 0) {
      console.log('Exchange rates already exist, skipping initialization');
      return;
    }
    
    console.log('Initializing exchange rates...');
    
    // Создаем курсы валют
    for (const rate of INITIAL_EXCHANGE_RATES) {
      const newRate = exchangeRateRepository.create(rate);
      await exchangeRateRepository.save(newRate);
    }
    
    console.log(`Initialized ${INITIAL_EXCHANGE_RATES.length} exchange rates`);
  } catch (error) {
    console.error('Error initializing exchange rates:', error);
  }
};
