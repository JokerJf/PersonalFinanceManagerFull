import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { initExchangeRates } from './utils/initExchangeRates';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

import authRoutes         from './routes/auth';
import accountRoutes      from './routes/account';
import transactionRoutes  from './routes/transaction';
import budgetRoutes       from './routes/budget';
import debtRoutes         from './routes/debt';
import creditRoutes       from './routes/credit';
import exchangeRateRoutes from './routes/exchangeRate';
import notificationRoutes from './routes/notification';
import analyticsRoutes    from './routes/analytics';
import familyRequestRoutes from './routes/familyRequest';

const app = express();
const PORT = process.env.PORT || 8080;

// Доверяем первому прокси (nginx) — нужно для корректного X-Forwarded-For
// Это позволяет rate limiter получать реальный IP клиента, а не IP nginx
app.set('trust proxy', 1);

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') ?? ['*'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    // Also allow if CORS_ORIGIN is *
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use(apiLimiter);

// Health check — no auth needed
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes (API contract unchanged)
app.use('/api/auth',            authRoutes);
app.use('/api/accounts',        accountRoutes);
app.use('/api/transactions',    transactionRoutes);
app.use('/api/budgets',         budgetRoutes);
app.use('/api/debts',           debtRoutes);
app.use('/api/credits',         creditRoutes);
app.use('/api/exchange-rates',  exchangeRateRoutes);
app.use('/api/notifications',   notificationRoutes);
app.use('/api/analytics',       analyticsRoutes);
app.use('/api/family-requests', familyRequestRoutes);

app.use(errorHandler);

AppDataSource.initialize()
  .then(async () => {
    logger.info('Database connected');
    await initExchangeRates();
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    logger.error('Database connection failed', { error });
    process.exit(1);
  });

export default app;
