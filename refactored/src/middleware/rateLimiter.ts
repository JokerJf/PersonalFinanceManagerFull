import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Получаем реальный IP клиента.
 * Учитываем proxy/nginx (X-Forwarded-For), но берём ПЕРВЫЙ IP из цепочки —
 * это IP конечного пользователя, а не промежуточного прокси.
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For может быть "clientIP, proxy1, proxy2"
    const firstIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(',')[0];
    return firstIp.trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
};

/**
 * Лимитер для /auth (login, register, refresh).
 *
 * Ключ = IP клиента (не общий для всего сервера).
 * Окно — 10 минут, максимум 15 попыток.
 *
 * Это значит: один пользователь который спамит НЕ блокирует других,
 * так как у каждого IP свой счётчик.
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 минут
  max: 15,                   // максимум 15 попыток с одного IP за 10 минут
  standardHeaders: true,
  legacyHeaders: false,

  // Ключ — только IP, каждый пользователь получает свой лимит
  keyGenerator: (req: Request): string => getClientIp(req),

  // Пропускаем запросы с валидным Bearer токеном —
  // уже аутентифицированные пользователи не должны попадать под auth-лимит
  skip: (req: Request): boolean => {
    const auth = req.headers['authorization'];
    return !!(auth && auth.startsWith('Bearer '));
  },

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Слишком много попыток входа. Пожалуйста, подождите 10 минут.',
      retryAfter: 600,
    });
  },
});

/**
 * Общий API лимитер — защита от DDoS.
 * Ключ = IP, окно 1 минута, 300 запросов.
 * Каждый IP считается отдельно — один пользователь не блокирует других.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request): string => getClientIp(req),

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Слишком много запросов. Пожалуйста, подождите немного.',
      retryAfter: 60,
    });
  },
});
