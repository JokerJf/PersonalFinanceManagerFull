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

// Rate limiting storage for DDoS protection
// Blocks IP for 30 minutes after exceeding limit, then allows for 1 hour
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean; blockUntil: number; loginAttempts: number }>();
const WINDOW_MS = 10 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS = 250; // Max requests per window
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes block
const ALLOW_DURATION = 60 * 60 * 1000; // 1 hour allow after block
const LOGIN_MAX_ATTEMPTS = 10; // Max failed login attempts per window
const LOGIN_BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes block for failed logins

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (data.blockUntil < now && data.resetTime < now - WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

const ddosLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let ipData = rateLimitStore.get(ip);
  
  // Check if IP is currently blocked (general block)
  if (ipData && ipData.blocked && ipData.blockUntil > now) {
    const remainingTime = Math.ceil((ipData.blockUntil - now) / 1000 / 60);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Слишком много запросов. Попробуйте через ${remainingTime} минут`,
      blockedUntil: new Date(ipData.blockUntil).toISOString()
    });
  }
  
  // Reset if the allow period has passed
  if (ipData && !ipData.blocked && ipData.resetTime < now - ALLOW_DURATION) {
    ipData = undefined;
  }
  
  // Initialize or update IP data
  if (!ipData || ipData.resetTime < now - WINDOW_MS) {
    ipData = { count: 0, resetTime: now, blocked: false, blockUntil: 0, loginAttempts: 0 };
  }
  
  ipData.count++;
  
  // Block if limit exceeded
  if (ipData.count > MAX_REQUESTS) {
    ipData.blocked = true;
    ipData.blockUntil = now + BLOCK_DURATION;
    rateLimitStore.set(ip, ipData);
    
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Превышен лимит запросов. Вы заблокированы на ${BLOCK_DURATION / 1000 / 60} минут`,
      blockedUntil: new Date(ipData.blockUntil).toISOString()
    });
  }
  
  rateLimitStore.set(ip, ipData);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - ipData.count));
  res.setHeader('X-RateLimit-Reset', new Date(ipData.resetTime + WINDOW_MS).toISOString());
  
  next();
};

// Apply DDoS protection to all routes
app.use(ddosLimiter);

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

// Special rate limiting for login endpoint
app.use('/api/auth/login', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let ipData = rateLimitStore.get(ip);
  
  // Initialize if not exists
  if (!ipData) {
    ipData = { count: 0, resetTime: now, blocked: false, blockUntil: 0, loginAttempts: 0 };
  }
  
  // Check if login is blocked due to failed attempts
  if (ipData.loginAttempts >= LOGIN_MAX_ATTEMPTS && ipData.blockUntil > now) {
    const remainingTime = Math.ceil((ipData.blockUntil - now) / 1000 / 60);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Слишком много неудачных попыток входа. Попробуйте через ${remainingTime} минут`,
      blockedUntil: new Date(ipData.blockUntil).toISOString()
    });
  }
  
  // Store original send to intercept response
  const originalSend = res.send;
  res.send = function(body?: any) {
    // Check if login failed (401)
    if (res.statusCode === 401) {
      const ipData = rateLimitStore.get(ip);
      if (ipData) {
        ipData.loginAttempts = (ipData.loginAttempts || 0) + 1;
        if (ipData.loginAttempts >= LOGIN_MAX_ATTEMPTS) {
          ipData.blocked = true;
          ipData.blockUntil = now + LOGIN_BLOCK_DURATION;
        }
        rateLimitStore.set(ip, ipData);
      }
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Admin endpoint to clear rate limits (for development)
app.post('/api/admin/clear-rate-limits', (req: express.Request, res: express.Response) => {
  const { secret } = req.body;
  // Simple secret check (in production use proper auth)
  if (secret !== 'dev-secret-key') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  rateLimitStore.clear();
  res.json({ success: true, message: 'Rate limits cleared' });
});

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
