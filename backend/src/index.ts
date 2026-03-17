import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { initExchangeRates } from './utils/initExchangeRates';
import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import transactionRoutes from './routes/transaction';
import budgetRoutes from './routes/budget';
import debtRoutes from './routes/debt';
import creditRoutes from './routes/credit';
import exchangeRateRoutes from './routes/exchangeRate';
import notificationRoutes from './routes/notification';
import analyticsRoutes from './routes/analytics';
import familyRequestRoutes from './routes/familyRequest';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/family-requests', familyRequestRoutes);

// Error handling
app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    
    // Инициализируем курсы валют
    initExchangeRates();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

export default app;
